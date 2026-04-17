import json
from typing import List
from langchain_core.tools import tool


def make_tools(user_id: int):
    """
    Build LangChain tools with user_id baked in via closure.
    The LLM never controls user_id — it is always injected server-side.
    """

    @tool
    def get_user_experiments(limit: int = 20) -> str:
        """
        Returns a list of the user's correlation analysis experiments (name, state, type, submit date).
        Use this to answer questions about the user's pipeline experiments.
        """
        from api_service.models import Experiment
        qs = Experiment.objects.filter(user_id=user_id).order_by('-submit_date')[:limit]
        data = list(qs.values('id', 'name', 'description', 'state', 'type', 'submit_date'))
        return json.dumps(data, default=str)

    @tool
    def get_user_biomarkers(limit: int = 20) -> str:
        """
        Returns the user's biomarkers (own + public). Includes name, description, state.
        Use this to answer questions about biomarkers.
        """
        from django.db.models import Q
        from biomarkers.models import Biomarker
        qs = Biomarker.objects.filter(
            Q(user_id=user_id) | Q(is_public=True)
        ).distinct().order_by('-upload_date')[:limit]
        data = list(qs.values('id', 'name', 'description', 'state', 'upload_date', 'is_public'))
        return json.dumps(data, default=str)

    @tool
    def get_statistical_validations(limit: int = 20) -> str:
        """
        Returns statistical validations belonging to the user's biomarkers.
        Use this to answer questions about statistical validation results (c_index, MSE, etc.).
        """
        from statistical_properties.models import StatisticalValidation
        qs = StatisticalValidation.objects.filter(
            biomarker__user_id=user_id
        ).order_by('-created')[:limit]
        data = list(qs.values('id', 'name', 'description', 'state', 'c_index', 'mean_squared_error', 'created'))
        return json.dumps(data, default=str)

    @tool
    def get_inference_experiments(limit: int = 20) -> str:
        """
        Returns inference experiments for the user's biomarkers.
        Use this to answer questions about model inference results.
        """
        from inferences.models import InferenceExperiment
        qs = InferenceExperiment.objects.filter(
            biomarker__user_id=user_id
        ).order_by('-created')[:limit]
        data = list(qs.values('id', 'name', 'description', 'state', 'created'))
        return json.dumps(data, default=str)

    @tool
    def get_feature_selection_experiments(limit: int = 20) -> str:
        """
        Returns feature selection experiments owned by the user.
        Use this to answer questions about feature selection runs and algorithms used.
        """
        from feature_selection.models import FSExperiment
        qs = FSExperiment.objects.filter(user_id=user_id).order_by('-id')[:limit]
        data = list(qs.values('id', 'algorithm', 'execution_time'))
        return json.dumps(data, default=str)

    @tool
    def search_cgds_studies(query: str) -> str:
        """
        Searches available cBioPortal (CGDS) studies by name.
        Use this to find publicly available cancer genomics datasets.
        """
        from datasets_synchronization.models import CGDSStudy
        qs = CGDSStudy.objects.filter(name__icontains=query)[:10]
        data = list(qs.values('id', 'name', 'description', 'url'))
        return json.dumps(data, default=str)

    @tool
    def get_gene_info(gene_name: str) -> str:
        """
        Returns information about a gene (type, chromosome, start, end, description).
        Use this to answer questions about specific genes.
        """
        from genes.models import Gene
        try:
            gene = Gene.objects.get(name__iexact=gene_name)
            return json.dumps({
                'name': gene.name,
                'type': gene.type,
                'description': gene.description,
                'chromosome': gene.chromosome,
                'start': gene.start,
                'end': gene.end,
            })
        except Gene.DoesNotExist:
            return json.dumps({'error': f'Gene "{gene_name}" not found'})

    @tool
    def get_experiment_top_results(experiment_id: int, limit: int = 20) -> str:
        """
        Returns the top correlation results (gene, GEM, correlation coefficient, p-value,
        adjusted p-value) for a specific correlation experiment owned by the user.
        Use this when the user asks about the results, top pairs, or significant correlations
        of a specific experiment. Always verify the experiment belongs to the user.
        Results are sorted by absolute correlation (strongest first).
        """
        from api_service.models import Experiment
        from api_service.models_choices import ExperimentState

        try:
            exp = Experiment.objects.get(pk=experiment_id, user_id=user_id)
        except Experiment.DoesNotExist:
            return json.dumps({'error': f'Experiment {experiment_id} not found or does not belong to you'})

        if exp.state != ExperimentState.COMPLETED:
            return json.dumps({'error': f'Experiment is not completed (state={exp.state})'})

        combination_class = exp.get_combination_class()
        qs = (
            combination_class.objects
            .filter(experiment=exp)
            .order_by('-correlation')  # strongest positive first
            .values('gene_id', 'gem', 'correlation', 'p_value', 'adjusted_p_value')[:limit]
        )
        results = list(qs)
        return json.dumps({
            'experiment_id': experiment_id,
            'experiment_name': exp.name,
            'type': exp.type,
            'total_results': exp.result_final_row_count,
            'top_results': results,
        }, default=str)

    @tool
    def get_differential_expression_results(experiment_id: int, limit: int = 20) -> str:
        """
        Returns the top differentially expressed genes for a specific differential expression
        experiment owned by the user. Results include gene name, log fold change (logFC),
        adjusted p-value (FDR), p-value, average expression and t-statistic.
        Results are sorted by adjusted p-value (most significant first).
        Use this when the user asks about DE results, upregulated/downregulated genes,
        or the output of a differential expression analysis.
        """
        from differential_expression.models import DifferentialExpressionExperiment, DifferentialExpressionExperimentState

        try:
            exp = DifferentialExpressionExperiment.objects.get(pk=experiment_id, user_id=user_id)
        except DifferentialExpressionExperiment.DoesNotExist:
            return json.dumps({'error': f'Differential expression experiment {experiment_id} not found or does not belong to you'})

        if exp.state != DifferentialExpressionExperimentState.COMPLETED:
            return json.dumps({'error': f'Experiment is not completed (state={exp.state})'})

        results = list(
            exp.results
            .order_by('adj_p_val')
            .values('gene', 'log_fc', 'adj_p_val', 'p_value', 'ave_expr', 't_statistic')[:limit]
        )
        return json.dumps({
            'experiment_id': experiment_id,
            'experiment_name': exp.name,
            'tool_used': exp.tool,
            'top_results': results,
        }, default=str)

    @tool
    def get_user_files(limit: int = 30) -> str:
        """
        Returns the list of files uploaded by the user (name, type, number of samples, upload date).
        Use this when the user asks about their datasets, uploaded files, or data sources.
        File types: 1=mRNA, 2=miRNA, 3=CNA, 4=Methylation, 5=Clinical.
        """
        from user_files.models import UserFile
        qs = UserFile.objects.filter(user_id=user_id).order_by('-upload_date')[:limit]
        data = list(qs.values('id', 'name', 'file_type', 'number_of_samples', 'upload_date'))
        return json.dumps(data, default=str)

    @tool
    def get_differential_expression_experiments(limit: int = 20) -> str:
        """
        Returns the user's differential expression experiments (name, state, tool used,
        number of results, creation date).
        Use this to list or find differential expression analyses before fetching their results.
        """
        from differential_expression.models import DifferentialExpressionExperiment
        qs = DifferentialExpressionExperiment.objects.filter(
            user_id=user_id
        ).order_by('-created_at')[:limit]
        data = list(qs.values('id', 'name', 'description', 'state', 'tool', 'created_at'))
        return json.dumps(data, default=str)

    @tool
    def search_curated_knowledge(query: str) -> str:
        """
        Searches the curated knowledge base using semantic similarity.
        Use this to answer general questions about how Multiomix works,
        biological concepts, or platform documentation.
        """
        from pgvector.django import CosineDistance
        from assistant.models import CuratedDocument
        from assistant.services.embedding_service import embedding_service

        query_embedding = embedding_service.embed(query)
        docs = (
            CuratedDocument.objects
            .filter(is_active=True, embedding__isnull=False)
            .annotate(distance=CosineDistance('embedding', query_embedding))
            .order_by('distance')[:5]
        )
        data = [{'title': d.title, 'category': d.category, 'content': d.content} for d in docs]
        return json.dumps(data)

    @tool
    def get_mirna_modulators(gene_name: str, min_score: float = 0.0, limit: int = 20) -> str:
        """
        Returns miRNAs known to target/regulate the expression of a specific gene,
        sourced from Modulector's miRNA-target interaction database.
        Use this when the user asks about miRNA modulators, expression regulators,
        or GEM (Gene Expression Modulator) interactions for a gene.
        Results include miRNA name, interaction score, and supporting evidence.
        """
        from api_service.mrna_service import global_mrna_service

        params: dict = {'gene': gene_name}
        if min_score > 0:
            params['score'] = str(min_score)

        data = global_mrna_service.get_modulector_service_content(
            'mirna-target-interactions',
            request_params=params,
            is_paginated=True,
            method='get'
        )

        if not data or data.get('count', 0) == 0:
            return json.dumps({
                'message': f'No miRNA modulators found for gene "{gene_name}" in the database.',
                'results': []
            })

        results = data.get('results', [])[:limit]
        return json.dumps({
            'gene': gene_name,
            'total_interactions': data.get('count', 0),
            'shown': len(results),
            'modulators': results
        }, default=str)

    @tool
    def get_gene_annotations(gene_name: str) -> str:
        """
        Returns detailed biological annotations for a gene from BioAPI,
        including aliases, biotype, summary, chromosomal location, and external database IDs
        (Ensembl, NCBI, HGNC, etc.).
        Use this when the user asks for biological context, description, or detailed
        information about a specific gene beyond basic coordinates.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_bioapi_service_content(
            'information-of-genes',
            request_params={'gene_ids': [gene_name]},
            is_paginated=False,
            method='post'
        )

        if not data:
            return json.dumps({'error': f'No annotation data found for gene "{gene_name}" in BioAPI.'})

        return json.dumps({'gene': gene_name, 'annotations': data}, default=str)

    @tool
    def get_drugs_regulating_gene(gene_name: str) -> str:
        """
        Returns a DrugBank link listing drugs that up-regulate or down-regulate
        the expression of a specific gene, sourced from BioAPI.
        Use this when the user asks about pharmacological regulators,
        drug modulators, or therapeutic targeting of a gene's expression.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_bioapi_service_content(
            f'/drugs-regulating-gene/{gene_name}',
            request_params={},
            is_paginated=False,
            method='get'
        )

        if not data or 'link' not in data:
            return json.dumps({
                'message': f'No drug regulation data found for gene "{gene_name}" in BioAPI.',
                'link': None
            })

        return json.dumps({
            'gene': gene_name,
            'drugbank_link': data.get('link')
        })

    return [
        get_user_experiments,
        get_experiment_top_results,
        get_user_biomarkers,
        get_statistical_validations,
        get_inference_experiments,
        get_feature_selection_experiments,
        search_cgds_studies,
        get_gene_info,
        get_gene_annotations,
        get_mirna_modulators,
        get_drugs_regulating_gene,
        search_curated_knowledge,
        get_user_files,
        get_differential_expression_experiments,
        get_differential_expression_results,
    ]
