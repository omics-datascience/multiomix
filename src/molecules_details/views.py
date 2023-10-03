from django.http import HttpRequest
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service


class GeneInformation(APIView):
    """
    Retrieves general data of a gene from BioAPI 'information-of-genes' service.
    Examples:
    http://localhost:8000/molecules/gene-information?gene=BRCA1
    http://localhost:8000/molecules/gene-information?gene=MSH3
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        data = global_mrna_service.get_bioapi_service_content(
            'information-of-genes',
            request_params={
                'gene_ids': [gene]
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data[gene] if data and gene in data else None
        })


class GeneGroups(APIView):
    """
    Gets the identifier of a gene, validates it and then returns the group of genes to which
    it belongs according to HGNC, and all the other genes that belong to the same group.
    Examples:
    http://localhost:8000/molecules/gene-groups?gene=LTN1
    http://localhost:8000/molecules/gene-groups?gene=SACS
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        if not gene:
            return Response({})

        data = global_mrna_service.get_bioapi_service_content(
            f'/genes-of-its-group/{gene}',
            request_params={},  # No params needed
            is_paginated=False,
            method='get'
        )
        return Response({
            'data': data if data else None
        })


class PathwaysInformation(APIView):
    """
    Retrieves general data of a gene from BioAPI 'pathways-in-common' service.
    The service is used with a single gene to bring from the databases all the information
    related to metabolic pathways for it.
    Examples:
    http://localhost:8000/molecules/pathways-information?gene=ULK4
    http://localhost:8000/molecules/pathways-information?gene=BRCA1,BRCA2
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()

        if gene:
            gene = gene.split(',')
        else:
            return Response({})

        data = global_mrna_service.get_bioapi_service_content(
            'pathways-in-common',
            request_params={
                'gene_ids': gene
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data['pathways'] if data and 'pathways' in data else None
        })


class MetabolicPathwaysInformation(APIView):
    """
    Retrieves genes from BioAPI '/pathway-genes/<source>/<external_id>' service.
    This service gets all genes of a metabolic pathway for a source database and an identifier
    of it.
    Examples:
    http://localhost:8000/molecules/metabolic-pathways-information?source=Reactome&id=R-HSA-5693537
    http://localhost:8000/molecules/metabolic-pathways-information?source=KEGG&id=hsa05224
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        source = request.GET.get('source', '').strip()
        id = request.GET.get('id', '').strip()
        if not source or not id:
            return Response({})

        data = global_mrna_service.get_bioapi_service_content(
            f'/pathway-genes/{source}/{id}',
            request_params={},  # No params needed
            is_paginated=False,
            method='get'
        )
        return Response({
            'data': data['genes'] if data and 'genes' in data else None
        })


class GeneOntologyTermsOfGene(APIView):
    """
    Gets the list of related terms for a gene.
    Examples:
    http://localhost:8000/molecules/gene-ontology-gene-terms?gene=TP53&filter_type=enrichment&p_value_threshold=0.09&correction_method=analytical
    http://localhost:8000/molecules/gene-ontology-gene-terms?gene=TP53&filter_type=union&relation_type=enables,involved_in&ontology_type=biological_process,molecular_function
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        filter_type = request.GET.get('filter_type', '').strip()
        p_value_threshold = request.GET.get('p_value_threshold', '').strip()
        correction_method = request.GET.get('correction_method', '').strip()
        relation_type = request.GET.get('relation_type', '').strip()
        ontology_type = request.GET.get('ontology_type', '').strip()

        if gene:
            gene = gene.split(',')
        else:
            return Response({})

        if not filter_type:
            filter_type = 'intersection'

        if filter_type not in ["intersection", "union", "enrichment"]:
            return Response({})
        else:
            if filter_type == 'enrichment':
                if not p_value_threshold or not correction_method:
                    return Response({})
            else:
                if not relation_type:
                    relation_type = ["enables", "involved_in", "part_of", "located_in"]
                else:
                    relation_type = relation_type.split(',')
                    for relation in relation_type:
                        if relation not in ["enables", "involved_in", "part_of", "located_in"]:
                            return Response({})
        if not ontology_type:
            ontology_type = ["biological_process", "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type in ontology_type:
                if type not in ["biological_process", "molecular_function", "cellular_component"]:
                    return Response({})
        data = {}
        if filter_type in ["intersection", "union"]:
            data = global_mrna_service.get_bioapi_service_content(
                'genes-to-terms',
                request_params={
                    'gene_ids': [gene],
                    'filter_type': filter_type,
                    'ontology_type': ontology_type,
                    'relation_type': relation_type
                },
                is_paginated=False,
                method='post'
            )
        else:  # filter_type == "enrichment"
            data = global_mrna_service.get_bioapi_service_content(
                'genes-to-terms',
                request_params={
                    'gene_ids': gene,
                    'filter_type': filter_type,
                    'p_value_threshold': p_value_threshold,
                    'correction_method': correction_method,
                    'ontology_type': ontology_type
                },
                is_paginated=False,
                method='post'
            )

        return Response({
            'go_terms': data
        })


class GeneOntologyTermsOfTerm(APIView):
    """
    Gets the list of related terms to a term.
    Examples:
    http://localhost:8000/molecules/gene-ontology-term-terms?term_id=0000122&relations=part_of,regulates&ontology_type=biological_process,molecular_function&general_depth=3&hierarchical_depth_to_children=3&to_root=1
    http://localhost:8000/molecules/gene-ontology-term-terms?term_id=0000122&general_depth=1&hierarchical_depth_to_children=3&to_root=0
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        term_id = request.GET.get('term_id', '').strip()
        relations = request.GET.get('relations', '').strip()
        ontology_type = request.GET.get('ontology_type', '').strip()
        general_depth = request.GET.get('general_depth', '').strip()
        hierarchical_depth_to_children = request.GET.get('hierarchical_depth_to_children', '').strip()
        to_root = request.GET.get('to_root', '').strip()

        if not term_id:
            return Response({})

        if not general_depth:
            return Response({})
        if not general_depth.isnumeric():
            return Response({})

        if not hierarchical_depth_to_children:
            return Response({})
        if not hierarchical_depth_to_children.isnumeric():
            return Response({})

        if not to_root:
            return Response({})
        if to_root not in ["0", "1"]:
            return Response({})

        if not relations:
            relations = ["part_of", "regulates", "has_part"]
        else:
            relations = relations.split(',')
            for relation in relations:
                if relation not in ["part_of", "regulates", "has_part"]:
                    return Response({})

        if not ontology_type:
            ontology_type = ["biological_process", "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type in ontology_type:
                if type not in ["biological_process", "molecular_function", "cellular_component"]:
                    return Response({})

        data = {}
        data = global_mrna_service.get_bioapi_service_content(
            'related-terms',
            request_params={
                'term_id': term_id,
                'relations': relations,
                'ontology_type': ontology_type,
                'general_depth': int(general_depth),
                'hierarchical_depth_to_children': int(hierarchical_depth_to_children),
                'to_root': int(to_root)
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'go_terms': data
        })


class ActionableAndCancerGenes(APIView):
    """
    Retrieves information of actionable genes and drugs obtained from the
    OncoKB database, at a therapeutic, diagnostic and prognostic level.
    Examples:
    http://localhost:8000/molecules/actionable-cancer-genes?gene=TP53
    http://localhost:8000/molecules/actionable-cancer-genes?gene=MSH6,EGFR
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        if not gene:
            return Response({})
        else:
            gene = gene.split(',')
        data = global_mrna_service.get_bioapi_service_content(
            'information-of-oncokb',
            request_params={
                'gene_ids': gene
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data if data else None
        })


class DrugsPharmGKB(APIView):
    """
    Gets a list of related drugs to a list of genes.
    Examples:
    http://localhost:8000/molecules/drugs-pharmgkb?gene=EGFR
    http://localhost:8000/molecules/drugs-pharmgkb?gene=MSH6,EGFR,TP53,BRAF
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        if not gene:
            return Response({})
        else:
            gene = gene.split(',')

        data = global_mrna_service.get_bioapi_service_content(
            'drugs-pharm-gkb',
            request_params={
                'gene_ids': gene
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data if data else None
        })


class PredictedFunctionalAssociationsNetwork(APIView):
    """
    Gets a list of genes and relations related to a gene.
    Examples:
    http://localhost:8000/molecules/predicted-functiona-associations-network?gene=MX2&score=996
    http://localhost:8000/molecules/predicted-functiona-associations-network?gene=BRCA1&score=995
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        score = request.GET.get('score', '').strip()
        if not gene or not score:
            return Response({})

        if score.isnumeric():
            if int(score) < 1 or int(score) > 1000:
                return Response({})
        else:
            return Response({})

        data = global_mrna_service.get_bioapi_service_content(
            'string-relations',
            request_params={
                'gene_id': gene,
                'min_combined_score': int(score)
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data if data else None
        })


class DrugsRegulatingGene(APIView):
    """
    Service that takes gene symbol and returns a link to https://go.drugbank.com with
    all the drugs that upregulate and down regulate its expresion.
    Examples:
    http://localhost:8000/molecules/drugs-regulating-gene?gene=TP53
    http://localhost:8000/molecules/drugs-regulating-gene?gene=EGFR
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        if not gene:
            return Response({})

        data = global_mrna_service.get_bioapi_service_content(
            f'/drugs-regulating-gene/{gene}',
            request_params={},  # No params needed
            is_paginated=False,
            method='get'
        )
        return Response({
            'data': data
        })

