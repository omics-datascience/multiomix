from common.exceptions import EmptyDataset
from common.typing import AbortEvent
from differential_expression.models import DifferentialExpressionExperiment
import logging
import warnings
from itertools import combinations

import numpy as np
import pandas as pd

# Filter R warnings BEFORE importing rpy2
warnings.filterwarnings('ignore',
                       message='Environment variable "XPC_SERVICE_NAME" redefined by R',
                       category=UserWarning)
warnings.filterwarnings('ignore',
                       message='Environment variable "R_SESSION_TMPDIR" redefined by R and overriding existing variable.',
                       category=UserWarning)

import rpy2.robjects as robjects
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import get_conversion, localconverter
from rpy2.robjects.pandas2ri import converter
from rpy2.robjects.packages import importr

class DifferentialExpressionService:
    def __init__(self, experiment: DifferentialExpressionExperiment, is_aborted: AbortEvent):
        self.experiment = experiment
        self.is_aborted = is_aborted

    def perform_differential_expression(self) -> pd.DataFrame:
        clinical_df, mrna_df = self._process_datasets()
        
        sample_column = 'SAMPLE_ID'
        if sample_column in clinical_df.columns:
            common_samples = sorted(set(mrna_df.columns) & set(clinical_df[sample_column]))

            # Check if there are samples in common
            if len(common_samples) == 0:
                from differential_expression.models import DifferentialExpressionExperimentState
                raise ValueError("NO_SAMPLES_IN_COMMON")

            df_RNAseq_filtered = mrna_df[common_samples]
            df_clinical_filtered = clinical_df[clinical_df[sample_column].isin(common_samples)]
            df_clinical_filtered = df_clinical_filtered.set_index(sample_column).reindex(common_samples).reset_index()
        else:
            df_RNAseq_filtered = mrna_df
            df_clinical_filtered = clinical_df

        # Check if we have any features (genes) left after filtering
        if df_RNAseq_filtered.empty or df_RNAseq_filtered.shape[0] == 0:
            raise ValueError("NO_FEATURES_FOUND")
            
        try:
            # Import R packages
            limma = importr('limma')  # limma for differential expression
            stats = importr('stats')  # stats for model matrix
            base = importr('base')  # base R functions

            # 1. Validation: Ensure the clinical attribute has at least two categories
            # This is necessary because differential expression requires at least two groups to compare.
            unique_values = df_clinical_filtered[self.experiment.clinical_attribute].dropna().unique()
            if len(unique_values) < 2:
                raise ValueError(f"At least two categories are required in '{self.experiment.clinical_attribute}'.")
            
            # 2. Group vector creation
            # Converts the clinical attribute to a categorical variable (factor in R).
            # This tells the model to treat the values as groups, not as numeric values.
            group_values = df_clinical_filtered[self.experiment.clinical_attribute].astype(str).values
            group_levels = sorted(np.unique(group_values))  # Get all unique group names sorted
            group_dict = {k: i for i, k in enumerate(group_levels)}  # Map group names to indices (not strictly needed)
            group_factor = pd.Categorical(group_values, categories=group_levels)
            
            # 3. Conversion to R objects
            # Converts the filtered log-expression data (Pandas DataFrame) to an R matrix.
            with localconverter(get_conversion() + converter):
                r_log_data = pandas2ri.py2rpy(df_RNAseq_filtered)
            # Convert the group factor to an R factor vector
            r_group = robjects.FactorVector(group_factor)
            
            # 4. Design matrix construction (no intercept)
            # The design matrix encodes the group structure for the linear model.
            # Using '~ 0 + group' means no intercept: each group gets its own column.
            formula = robjects.Formula('~ 0 + group')
            env = robjects.Environment()
            env['group'] = r_group
            r_design = stats.model_matrix(formula, env)
            r_design.colnames = robjects.StrVector(group_levels)  # Set column names to group names
            
            # 5. Linear model fitting with limma
            # Fit the linear model to estimate mean expression for each gene in each group.
            fit = limma.lmFit(r_log_data, r_design)
            
            # 6. Create all possible pairwise contrasts (all-vs-all)
            # For each pair of groups, create a contrast expression like 'groupB - groupA'.
            pares = list(combinations(group_levels, 2))
            contrastes = [f"{b} - {a}" for a, b in pares]
            contrast_matrix = limma.makeContrasts(
                contrasts=robjects.StrVector(contrastes),
                levels=r_design
            )
            
            # 7. Apply contrasts and empirical Bayes moderation
            # Apply the contrasts to the fitted model, then use eBayes to stabilize variance estimates.
            fit2 = limma.contrasts_fit(fit, contrast_matrix)
            fit2 = limma.eBayes(fit2)
            
            # 8. Extract results for the first contrast
            # Get the table of differential expression results for the first contrast (logFC, p-value, adjusted p-value, etc.).
            results = limma.topTable(
                fit2,
                coef=1,  # First contrast
                number=robjects.r('Inf'),  # All genes
                adjust_method="BH"  # Benjamini-Hochberg adjustment
            )
            
            # Convert the R data frame to a Pandas DataFrame for further analysis in Python.
            results_df = pandas2ri.rpy2py(results)
            
            # Return top genes sorted by adjusted p-value, keeping gene names as index
            top_genes = results_df.nsmallest(self.experiment.top, 'adj.P.Val')
            
            return top_genes
        
        except Exception as e:
            logging.error(f"Error occurred during differential expression analysis: {e}")
            raise

    def _process_datasets(self):
        """Process clinical and mRNA datasets for differential expression analysis."""
        clinical_df = self.experiment.clinical_source.get_df()
        mrna_df = self.experiment.mrna_source.get_df()

        if clinical_df.empty or mrna_df.empty:
            raise EmptyDataset("One or both datasets are empty.")

        data_processing_service = DataProcessingService(
            clinical_df=clinical_df,
            mrna_df=mrna_df,
            clinical_attribute=self.experiment.clinical_attribute,
            threshold_percentile=self.experiment.threshold_percentile,
            threshold=self.experiment.threshold
        )

        return data_processing_service.process_datasets()


class DataProcessingService:
    """
    Service for processing clinical and RNA-Seq datasets.
    """
    
    def __init__(self, 
                 clinical_df: pd.DataFrame, 
                 mrna_df: pd.DataFrame, 
                 clinical_attribute: str, 
                 threshold_percentile: float = 0.15,
                 threshold : float = 1e-4):
        
        self.clinical_df = clinical_df
        self.mrna_df = mrna_df
        self.clinical_attribute = clinical_attribute
        self.threshold_percentile = threshold_percentile
        self.threshold = threshold

    def validate_datasets(self):
        """Validate the clinical and mRNA datasets.

        Raises:
            EmptyDataset: If either dataset is empty.
        """
        if self.clinical_df.empty:
            raise EmptyDataset("Clinical dataset is empty.")
        if self.mrna_df.empty:
            raise EmptyDataset("mRNA dataset is empty.")

    def _process_clinical_data(self) -> None:
        """Process the clinical dataset.
        This method filters the clinical dataset to keep only the relevant columns,
        removes rows with NA values in the clinical attribute, and ensures that
        the clinical attribute is in uppercase if it is of string type.
        """
        
        ###### Procesar datos clínicos #####
        # Reset index para convertir PATIENT_ID de índice a columna
        clinical_df_reset = self.clinical_df.reset_index()
        
        # Create sample dataframe with SAMPLE_ID and PATIENT_ID
        df_clinical_sample = clinical_df_reset[['SAMPLE_ID', 'PATIENT_ID']]
        
        # Create patient dataframe with PATIENT_ID and clinical attribute, removing NA values
        df_clinical_patient = clinical_df_reset[['PATIENT_ID', self.clinical_attribute]].dropna(subset=[self.clinical_attribute])
        
        # Si la columna es de tipo texto, limpiar y convertir a mayúsculas
        if df_clinical_patient[self.clinical_attribute].dtype == 'object':
            # Eliminar espacios al inicio y al final, luego convertir a mayúsculas
            df_clinical_patient[self.clinical_attribute] = df_clinical_patient[self.clinical_attribute].astype(
                str).str.strip().str.upper()

        # Eliminar filas duplicadas
        df_clinical_patient = df_clinical_patient.drop_duplicates()
        
        ##### Procesar datos de muestra #####
        # df_clinical_sample = self.clinical_df[['SAMPLE_ID', 'PATIENT_ID']]
        
        ##### Fusionar datos clínicos y de muestra #####
        df_clinical = pd.merge(df_clinical_sample, df_clinical_patient, on='PATIENT_ID', how='inner')
        df_clinical = df_clinical[['SAMPLE_ID', self.clinical_attribute]]

        df_clinical = df_clinical.drop_duplicates()
        df_clinical['SAMPLE_ID'] = df_clinical['SAMPLE_ID'].str.replace('-', '.')
        
        self.clinical_df = df_clinical
        logging.info("Clinical data processed successfully.")


    def _process_mrna_data(self) -> None:
        """Process the mRNA dataset.
        This method processes the mRNA dataset by renaming columns, removing duplicates,
        filtering samples based on the clinical dataset, and cleaning up NA values.
        """

        mrna_dataset = self.mrna_df.copy()

        mrna_dataset.reset_index(inplace=True)

        # SOLUCIÓN: Reemplazar guiones por puntos en los nombres de las columnas sino no puede machear con SAMPLE_ID
        columns_to_rename = {}
        for col in mrna_dataset.columns:
            if col not in 'Standard_Symbol':
                columns_to_rename[col] = col.replace('-', '.')

        mrna_dataset = mrna_dataset.rename(columns=columns_to_rename)

        mrna_dataset = mrna_dataset.drop_duplicates(subset=['Standard_Symbol'], keep='first')

        # # Si Standard_Symbol está como índice, convertirlo a columna
        # if mrna_dataset.index.name == 'Standard_Symbol' in str(mrna_dataset.index.name):
        #     mrna_dataset = mrna_dataset.reset_index()

        # Si Standard_Symbol no está como columna pero está en el índice
        # if 'Standard_Symbol' not in mrna_dataset.columns and mrna_dataset.index.name is not None:
        #     mrna_dataset = mrna_dataset.reset_index()
        #     # Renombrar la primera columna a Standard_Symbol si es necesario
        #     if mrna_dataset.columns[0] != 'Standard_Symbol':
        #         mrna_dataset = mrna_dataset.rename(columns={mrna_dataset.columns[0]: 'Standard_Symbol'})


        # Eliminar duplicados manteniendo la primera ocurrencia
        # mrna_dataset = self.mrna_df.drop_duplicates(subset=['Standard_Symbol'], keep='first')
        
        # Antes de la intersección, normalizar los SAMPLE_ID extrayendo solo la parte base
        self.clinical_df['SAMPLE_ID'] = self.clinical_df['SAMPLE_ID'].str.rsplit('.', n=1).str[0]

        # Obtener valores de SAMPLE_ID del DataFrame de metadatos
        valid_columns = list(set(mrna_dataset.columns) & set(self.clinical_df['SAMPLE_ID']))
        
        # Filtrar el dataset de RNA-Seq para mantener solo las columnas válidas
        mrna_dataset = mrna_dataset[['Standard_Symbol'] + valid_columns]
        
        # Eliminar filas con NA en los datos de expresión génica
        # Eliminar filas donde Standard_Symbol es NA
        mrna_dataset = mrna_dataset.dropna(subset=['Standard_Symbol'])

        # Establecer Standard_Symbol como índice con el nombre Hugo_Symbol y eliminar la columna
        mrna_dataset = mrna_dataset.set_index('Standard_Symbol')
        mrna_dataset.index.name = 'Hugo_Symbol'
        
        self.mrna_df = mrna_dataset
        logging.info("mRNA data processed successfully.")

    def _transform_to_log2(self) -> None:
        """Transform mRNA data to log2 scale.
        This method applies a log2 transformation to the mRNA dataset.
        """
        
        if isinstance(self.mrna_df, pd.DataFrame):
            has_negative = (self.mrna_df < 0).any().any()
        else:
            has_negative = np.any(self.mrna_df < 0)
            
        if has_negative:
            logging.warning("Negative values found in mRNA dataset. Skipping log2 transformation.")
        
        # Apply log2 transformation
        mrna_df_log2 = np.log2(self.mrna_df + 1)
        
        self.mrna_df = mrna_df_log2
        logging.info("Log2 transformation applied to mRNA data.")
        
    def _filter_low_expression_genes(self) -> None:
        """Filter out low-expression genes from the mRNA dataset.
        This method removes genes whose maximum expression across samples is below
        a specified percentile threshold.
        """
        
        # Calculate the average expression for each gene (across all samples)
        avg_expression = self.mrna_df.mean(axis=1)

        # Calculate the threshold based on the percentile
        threshold = np.percentile(avg_expression, self.threshold_percentile * 100)
        
        # Filter genes with average expression above or equal to the threshold
        genes_to_keep = avg_expression >= threshold
        self.mrna_df = self.mrna_df[genes_to_keep]
        
        self.mrna_df = self.mrna_df
        logging.info(f"Filtered low-expression genes. Threshold: {threshold:.2f}")
        
    
    def _filter_genes_by_variance(self) -> None:
        """Filter genes based on variance.
        This method removes genes whose variance across samples is below
        a specified percentile threshold.
        """
        
        # Calculate variance for each gene (row)
        variances = self.mrna_df.var(axis=1)

        # Filter out genes with variance below the threshold
        genes_to_keep = variances > self.threshold
        self.mrna_df = self.mrna_df[genes_to_keep]

        # Check if we still have features after filtering
        if self.mrna_df.empty or self.mrna_df.shape[0] == 0:
            raise ValueError("NO_FEATURES_FOUND")

        logging.info(f"Filtered genes by variance. Threshold: {self.threshold:.2f}")
        
    
    def process_datasets(self) -> tuple[pd.DataFrame, pd.DataFrame]:
        """Process the clinical and mRNA datasets.
        This method orchestrates the processing steps for both datasets.
        
        Returns:
            Tuple containing the processed clinical and mRNA datasets.
        """
        
        self.validate_datasets()
        self._process_clinical_data()
        self._process_mrna_data()
        self._transform_to_log2()
        self._filter_low_expression_genes()
        self._filter_genes_by_variance()
        
        return self.clinical_df, self.mrna_df