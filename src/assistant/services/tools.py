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
    def get_string_interaction_partners(gene_name: str, limit: int = 10) -> str:
        """
        Returns the top protein-protein interaction partners for a gene from the STRING database.
        Results include partner gene name and interaction scores (combined, experimental,
        textmining, databases, coexpression).
        Use this when the user asks about protein interactions, interaction networks,
        or which proteins interact with a specific gene.
        Only human proteins (species 9606) are queried.
        """
        import urllib.request
        import urllib.parse

        params = urllib.parse.urlencode({
            'identifiers': gene_name,
            'species': 9606,
            'limit': min(limit, 20),
            'caller_identity': 'multiomix_platform',
        })
        url = f'https://string-db.org/api/json/interaction_partners?{params}'
        try:
            with urllib.request.urlopen(url, timeout=12) as resp:
                data = json.loads(resp.read().decode())
        except Exception as e:
            return json.dumps({'error': f'STRING API error: {str(e)}'})

        if not data:
            return json.dumps({'gene': gene_name, 'partners': [], 'message': 'No interactions found.'})

        partners = [{
            'partner': item.get('preferredName_B', ''),
            'combined_score': round(item.get('score', 0), 3),
            'experimental': round(item.get('escore', 0), 3),
            'textmining': round(item.get('tscore', 0), 3),
            'databases': round(item.get('dscore', 0), 3),
            'coexpression': round(item.get('ascore', 0), 3),
        } for item in data]

        return json.dumps({'gene': gene_name, 'partners_shown': len(partners), 'partners': partners})

    @tool
    def get_string_functional_enrichment(gene_names: str) -> str:
        """
        Returns functional enrichment analysis (GO Biological Process, GO Molecular Function,
        GO Cellular Component, KEGG, Reactome, etc.) for a list of genes using the STRING database.
        Provide gene_names as a comma-separated string (e.g., "TP53,BRCA1,MYC").
        Returns the top enriched terms sorted by false discovery rate (FDR).
        Use this when the user asks about pathways, biological processes, molecular functions,
        or wants to functionally annotate a gene set from their experiments.
        """
        import urllib.request
        import urllib.parse

        genes = [g.strip() for g in gene_names.split(',') if g.strip()]
        if not genes:
            return json.dumps({'error': 'No gene names provided.'})

        # STRING accepts multiple identifiers separated by carriage return (\r → %0D)
        params = urllib.parse.urlencode({
            'identifiers': '\r'.join(genes),
            'species': 9606,
            'caller_identity': 'multiomix_platform',
        })
        url = f'https://string-db.org/api/json/enrichment?{params}'
        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = json.loads(resp.read().decode())
        except Exception as e:
            return json.dumps({'error': f'STRING API error: {str(e)}'})

        if not data:
            return json.dumps({'genes': genes, 'enrichment': [], 'message': 'No enrichment results found.'})

        top = sorted(data, key=lambda x: float(x.get('fdr', 1)))[:15]
        enrichment = [{
            'category': item.get('category', ''),
            'term': item.get('term', ''),
            'description': item.get('description', ''),
            'fdr': item.get('fdr'),
            'p_value': item.get('p_value'),
            'gene_count': item.get('number_of_genes'),
        } for item in top]

        return json.dumps({'genes': genes, 'total_enriched_terms': len(data), 'top_terms': enrichment})

    @tool
    def get_string_network_url(gene_names: str) -> str:
        """
        Returns the URL of a STRING protein interaction network image for a list of genes.
        Provide gene_names as a comma-separated string (e.g., "TP53,BRCA1,MYC").
        Maximum 10 genes recommended for a readable network image.
        IMPORTANT: after calling this tool, ALWAYS include the image in your reply using
        markdown image syntax: ![STRING Network](url) — this will display the network
        directly in the chat so the user can see it.
        Use this when the user asks to visualize a protein network or wants a graphical
        view of gene/protein interactions.
        """
        import urllib.parse

        genes = [g.strip() for g in gene_names.split(',') if g.strip()][:10]
        if not genes:
            return json.dumps({'error': 'No gene names provided.'})

        params = urllib.parse.urlencode({
            'identifiers': '\r'.join(genes),
            'species': 9606,
            'caller_identity': 'multiomix_platform',
            'network_flavor': 'confidence',
        })
        url = f'https://string-db.org/api/image/network?{params}'

        return json.dumps({
            'genes': genes,
            'network_image_url': url,
            'markdown': f'![STRING Protein Network]({url})',
        })

    @tool
    def get_survival_experiments(limit: int = 20) -> str:
        """
        Returns the user's survival / statistical validation experiments with their metrics.
        Each experiment belongs to one of the user's biomarkers.
        Metrics: c_index, cox_c_index (Cox regression), cox_log_likelihood, r2_score, mean_squared_error.
        Use this to list or find survival analysis runs before fetching detailed results.
        """
        from statistical_properties.models import StatisticalValidation
        qs = StatisticalValidation.objects.filter(
            biomarker__user_id=user_id
        ).order_by('-created')[:limit]
        data = list(qs.values(
            'id', 'name', 'description', 'state', 'created',
            'c_index', 'cox_c_index', 'cox_log_likelihood', 'r2_score', 'mean_squared_error',
            'biomarker__id', 'biomarker__name',
        ))
        return json.dumps(data, default=str)

    @tool
    def get_survival_results(experiment_id: int) -> str:
        """
        Returns detailed survival analysis results for a specific statistical validation experiment.
        Includes survival metrics (c_index, cox_c_index, cox_log_likelihood, r2_score, mean_squared_error)
        and the list of molecules with their Cox regression coefficients.
        A positive coefficient means the molecule increases risk; negative means protective.
        Use this when the user asks about survival metrics or molecule coefficients of a specific
        statistical validation. Always verify the experiment belongs to the user via their biomarkers.
        """
        from statistical_properties.models import StatisticalValidation

        try:
            sv = StatisticalValidation.objects.select_related('biomarker').get(
                pk=experiment_id, biomarker__user_id=user_id
            )
        except StatisticalValidation.DoesNotExist:
            return json.dumps({'error': f'Survival validation {experiment_id} not found or does not belong to you'})

        molecules = list(sv.molecules_with_coefficients.values('identifier', 'coeff', 'type'))

        return json.dumps({
            'id': sv.id,
            'name': sv.name,
            'description': sv.description,
            'state': sv.state,
            'biomarker_id': sv.biomarker.id,
            'biomarker_name': sv.biomarker.name,
            'metrics': {
                'c_index': sv.c_index,
                'cox_c_index': sv.cox_c_index,
                'cox_log_likelihood': sv.cox_log_likelihood,
                'r2_score': sv.r2_score,
                'mean_squared_error': sv.mean_squared_error,
            },
            'molecules_with_coefficients': molecules,
        }, default=str)

    @tool
    def find_gene_across_experiments(gene_name: str) -> str:
        """
        Searches across all the user's correlation experiments (miRNA, CNA, Methylation) to find
        which ones contain a specific gene in their results.
        Returns the experiment name, type, paired GEM molecule, and correlation statistics.
        Use this when the user asks "in which experiments does gene X appear?",
        wants to explore all correlations involving a specific gene, or wants to discover
        which GEM molecules co-correlate with a gene across multiple experiments.
        """
        from api_service.models import GeneMiRNACombination, GeneCNACombination, GeneMethylationCombination

        results = []

        for CombClass, exp_type_label in [
            (GeneMiRNACombination, 'miRNA'),
            (GeneCNACombination, 'CNA'),
            (GeneMethylationCombination, 'Methylation'),
        ]:
            qs = (
                CombClass.objects
                .filter(experiment__user_id=user_id, gene__name__iexact=gene_name)
                .values(
                    'experiment__id', 'experiment__name', 'experiment__state',
                    'gem', 'correlation', 'p_value', 'adjusted_p_value',
                )
                .order_by('-correlation')[:10]
            )
            for row in qs:
                results.append({
                    'experiment_id': row['experiment__id'],
                    'experiment_name': row['experiment__name'],
                    'experiment_type': exp_type_label,
                    'gem': row['gem'],
                    'correlation': row['correlation'],
                    'p_value': row['p_value'],
                    'adjusted_p_value': row['adjusted_p_value'],
                })

        if not results:
            return json.dumps({
                'gene': gene_name,
                'found_in': 0,
                'results': [],
                'message': f'Gene "{gene_name}" not found in any of your experiments.',
            })

        return json.dumps({'gene': gene_name, 'found_in': len(results), 'results': results}, default=str)

    @tool
    def get_genes_in_biomarker(biomarker_id: int) -> str:
        """
        Returns all molecules contained in a specific biomarker, grouped by type:
        mRNAs (genes), miRNAs, CNAs, and methylation identifiers.
        Use this when the user asks which genes or molecules are part of a biomarker,
        or wants to review the composition of a biomarker before running further analyses.
        """
        from django.db.models import Q
        from biomarkers.models import Biomarker

        try:
            biomarker = Biomarker.objects.get(
                Q(user_id=user_id) | Q(is_public=True),
                pk=biomarker_id,
            )
        except Biomarker.DoesNotExist:
            return json.dumps({'error': f'Biomarker {biomarker_id} not found or not accessible'})

        return json.dumps({
            'id': biomarker.id,
            'name': biomarker.name,
            'description': biomarker.description,
            'mrnas': list(biomarker.mrnas.values_list('identifier', flat=True)),
            'mirnas': list(biomarker.mirnas.values_list('identifier', flat=True)),
            'cnas': list(biomarker.cnas.values_list('identifier', flat=True)),
            'methylations': list(biomarker.methylations.values_list('identifier', flat=True)),
        })

    @tool
    def get_experiment_detail(experiment_id: int) -> str:
        """
        Returns the full configuration of a correlation experiment: which datasets were used
        (mRNA source and GEM source — whether a user file or a cBioPortal dataset), the
        correlation and p-value adjustment methods, filtering thresholds, and execution statistics.
        Use this when the user asks what data was used in an experiment, what parameters were
        applied, or wants a complete summary of an experiment's setup.
        """
        from api_service.models import Experiment

        try:
            exp = Experiment.objects.select_related(
                'mRNA_source__user_file',
                'mRNA_source__cgds_dataset',
                'gem_source__user_file',
                'gem_source__cgds_dataset',
            ).get(pk=experiment_id, user_id=user_id)
        except Experiment.DoesNotExist:
            return json.dumps({'error': f'Experiment {experiment_id} not found or does not belong to you'})

        def source_info(source):
            if source is None:
                return None
            if source.user_file_id:
                uf = source.user_file
                return {'source_type': 'user_file', 'name': uf.name, 'file_type': uf.file_type}
            if source.cgds_dataset_id:
                ds = source.cgds_dataset
                return {
                    'source_type': 'cgds_dataset',
                    'file_path': ds.file_path,
                    'observation': ds.observation,
                    'number_of_samples': ds.number_of_samples,
                }
            return None

        return json.dumps({
            'id': exp.id,
            'name': exp.name,
            'description': exp.description,
            'type': exp.get_type_display(),
            'state': exp.get_state_display(),
            'submit_date': str(exp.submit_date),
            'mrna_source': source_info(exp.mRNA_source),
            'gem_source': source_info(exp.gem_source),
            'parameters': {
                'correlation_method': exp.get_correlation_method_display(),
                'p_values_adjustment_method': exp.get_p_values_adjustment_method_display(),
                'minimum_coefficient_threshold': exp.minimum_coefficient_threshold,
                'minimum_std_gene': exp.minimum_std_gene,
                'minimum_std_gem': exp.minimum_std_gem,
                'correlate_with_all_genes': exp.correlate_with_all_genes,
            },
            'results': {
                'evaluated_rows': exp.evaluated_row_count,
                'total_results': exp.result_total_row_count,
                'final_results': exp.result_final_row_count,
                'execution_time_seconds': exp.execution_time,
            },
        }, default=str)

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

        data = global_mrna_service.get_mirna_target_interactions(
            gene=gene_name,
            score=str(min_score) if min_score > 0 else None,
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
    def search_mirna(query: str) -> str:
        """
        Searches for miRNA identifiers in Modulector by name or partial name.
        Use this when the user asks to search, find, or look up a miRNA by name
        (e.g. "hsa-miR-132", "miR-21"). Returns a list of matching miRNA codes
        and their standard accession IDs.
        Always use this before get_mirna_details to confirm the exact identifier.
        """
        from api_service.mrna_service import global_mrna_service

        results = global_mrna_service.find_mirna_codes(query=query)

        if not results:
            return json.dumps({'message': f'No miRNAs found matching "{query}" in Modulector.'})

        aliases = global_mrna_service.get_mirna_codes(mirna_codes=results) or {}
        data = [{'molecule': m, 'standard': aliases.get(m)} for m in results]
        return json.dumps({'query': query, 'count': len(data), 'results': data}, default=str)

    @tool
    def get_mirna_details(mirna: str) -> str:
        """
        Returns detailed information about a specific miRNA from Modulector,
        including its accession ID, sequence, aliases, and database references.
        Use this with an exact miRNA identifier obtained from search_mirna.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_mirna_details(mirna=mirna)

        if not data:
            return json.dumps({'message': f'No information found for miRNA "{mirna}" in Modulector.'})

        return json.dumps({'mirna': mirna, 'details': data}, default=str)

    @tool
    def get_mirna_target_genes(mirna: str, min_score: float = 0.0, limit: int = 20) -> str:
        """
        Returns genes known to be targeted/regulated by a specific miRNA,
        sourced from Modulector's miRNA-target interaction database.
        Use this when the user asks which genes a miRNA regulates, targets,
        or silences, or asks about downstream targets of a miRNA.
        Results include gene name, interaction score, and supporting evidence.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_mirna_target_interactions(
            mirna=mirna,
            score=str(min_score) if min_score > 0 else None,
        )

        if not data or data.get('count', 0) == 0:
            return json.dumps({
                'message': f'No target genes found for miRNA "{mirna}" in Modulector.',
                'results': []
            })

        results = data.get('results', [])[:limit]
        return json.dumps({
            'mirna': mirna,
            'total_interactions': data.get('count', 0),
            'shown': len(results),
            'targets': results
        }, default=str)

    @tool
    def get_mirna_diseases(mirna: str, limit: int = 20) -> str:
        """
        Returns diseases associated with a specific miRNA from Modulector.
        Use this when the user asks about the clinical relevance, pathological
        associations, or disease context of a miRNA.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_diseases(mirna=mirna)

        if not data or data.get('count', 0) == 0:
            return json.dumps({
                'message': f'No disease associations found for miRNA "{mirna}" in Modulector.',
                'results': []
            })

        results = data.get('results', [])[:limit]
        return json.dumps({
            'mirna': mirna,
            'total': data.get('count', 0),
            'shown': len(results),
            'diseases': results
        }, default=str)

    @tool
    def get_mirna_drugs(mirna: str, limit: int = 20) -> str:
        """
        Returns drugs or molecules associated with a specific miRNA from Modulector.
        Use this when the user asks about pharmacological context, drug interactions,
        or therapeutic relevance of a miRNA.
        """
        from api_service.mrna_service import global_mrna_service

        data = global_mrna_service.get_drugs(mirna=mirna)

        if not data or data.get('count', 0) == 0:
            return json.dumps({
                'message': f'No drug associations found for miRNA "{mirna}" in Modulector.',
                'results': []
            })

        results = data.get('results', [])[:limit]
        return json.dumps({
            'mirna': mirna,
            'total': data.get('count', 0),
            'shown': len(results),
            'drugs': results
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
        get_experiment_detail,
        get_user_biomarkers,
        get_statistical_validations,
        get_survival_experiments,
        get_survival_results,
        get_inference_experiments,
        get_feature_selection_experiments,
        search_cgds_studies,
        get_gene_info,
        get_gene_annotations,
        get_mirna_modulators,
        search_mirna,
        get_mirna_details,
        get_mirna_target_genes,
        get_mirna_diseases,
        get_mirna_drugs,
        get_drugs_regulating_gene,
        get_string_interaction_partners,
        get_string_functional_enrichment,
        get_string_network_url,
        search_curated_knowledge,
        get_user_files,
        get_differential_expression_experiments,
        get_differential_expression_results,
        find_gene_across_experiments,
        get_genes_in_biomarker,
    ]
