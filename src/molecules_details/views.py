from django.http import HttpRequest
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service


class GeneInformation(APIView):
    """ Retrieves general data of a gene from BioAPI 'information-of-genes' service. """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene','').strip()
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


class PathwaysInformation(APIView):
    """ Retrieves general data of a gene from BioAPI 'pathways-in-common' service. 
    The service is used with a single gene to bring from the databases all the information related to metabolic pathways for it. """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        data = global_mrna_service.get_bioapi_service_content(
            'pathways-in-common',
            request_params={
                'gene_ids': [gene]
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data['pathways'] if data and 'pathways' in data else None
        })


class MetabolicPathwaysInformation(APIView):
    """ Retrieves genes from BioAPI '/pathway-genes/<source>/<external_id>' service.
    This service gets all genes of a metabolic pathway for a source database and an identifier of it """

    permission_classes = [permissions.IsAuthenticated]

    """
    correccion de descripciones
    cambio de gen por id
    """

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
    """  Gets the list of related terms for a gene """
    permission_classes = [permissions.IsAuthenticated]

    """
    Examples:
    http://localhost:8000/molecules/gene-ontology-gene-terms?gene=TP53&filter_type=enrichment&p_value_threshold=0.09&correction_method=analytical
    http://localhost:8000/molecules/gene-ontology-gene-terms?gene=TP53&filter_type=union&relation_type=enables,involved_in&ontology_type=biological_process,molecular_function
    """

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        filter_type = request.GET.get('filter_type', '').strip()
        p_value_threshold = request.GET.get('p_value_threshold', '').strip()
        correction_method = request.GET.get('correction_method', '').strip()
        relation_type = request.GET.get('relation_type', '').strip()
        ontology_type = request.GET.get('ontology_type', '').strip()

        if not gene:
            # print("No gene found")
            return Response({})

        if not filter_type:
            # print("No filter type found")
            filter_type = 'intersection'

        if filter_type not in ["intersection", "union", "enrichment"]:
            # print("filter_type is invalid. Should be one of this options: ['union', 'intersection', 'enrichment']")
            return Response({})
        else:
            if filter_type == 'enrichment':
                if not p_value_threshold or not correction_method:
                    # print("p_value_threshold and correction_method are required if filter_type is 'enrichment'")
                    return Response({})
            else:
                if not relation_type:
                    # print("relation_type not specified")
                    relation_type = ["enables", "involved_in", "part_of", "located_in"]
                else:
                    relation_type = relation_type.split(',')
                    for relation in relation_type:
                        if relation not in ["enables", "involved_in", "part_of", "located_in"]:
                            # print("relation_type should always be a list containing any permutation of the follow options: 'enables', 'involved_in', 'part_of', or 'located_in'")
                            return Response({})
        if not ontology_type:
            # print("No ontology type found")
            ontology_type = ["biological_process", "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type in ontology_type:
                if type not in ["biological_process", "molecular_function", "cellular_component"]:
                    # print("ontology_type should always be a list containing any permutation of the follow options: 'biological_process', 'molecular_function' or 'cellular_component'")
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
                    'gene_ids': [gene],
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
    """  gets the list of related terms to a term """
    permission_classes = [permissions.IsAuthenticated]

    """
    Examples:
    http://localhost:8000/molecules/gene-ontology-term-terms?term_id=0000122&relations=part_of,regulates&ontology_type=biological_process,molecular_function&general_depth=3&hierarchical_depth_to_children=3&to_root=1
    http://localhost:8000/molecules/gene-ontology-term-terms?term_id=0000122&general_depth=1&hierarchical_depth_to_children=3&to_root=0
    """

    @staticmethod
    def get(request: HttpRequest):
        term_id = request.GET.get('term_id', '').strip()
        relations = request.GET.get('relations', '').strip()
        ontology_type = request.GET.get('ontology_type', '').strip()
        general_depth = request.GET.get('general_depth', '').strip()
        hierarchical_depth_to_children = request.GET.get('hierarchical_depth_to_children', '').strip()
        to_root = request.GET.get('to_root', '').strip()

        if not term_id:
            print("No term_id found")
            return Response({})

        if not general_depth:
            print("No general_depth found")
            return Response({})
        if not general_depth.isnumeric():
            print("general_depth must be a Int")
            return Response({})

        if not hierarchical_depth_to_children:
            print("No hierarchical_depth_to_children found")
            return Response({})
        if not hierarchical_depth_to_children.isnumeric():
            print("hierarchical_depth_to_children must be a Int")
            return Response({})

        if not to_root:
            print("No to_root found")
            return Response({})
        if to_root not in ["0", "1"]:
            print("to_root must be 0 or 1")
            return Response({})

        if not relations:
            print("No relations found")
            relations = ["part_of", "regulates", "has_part"]
        else:
            relations = relations.split(',')
            for relation in relations:
                if relation not in ["part_of", "regulates", "has_part"]:
                    print(relation + " is not a valid relation")
                    return Response({})

        if not ontology_type:
            print("No ontology type found")
            ontology_type = ["biological_process", "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type in ontology_type:
                if type not in ["biological_process", "molecular_function", "cellular_component"]:
                    print(type + " is not a valid ontology_type")
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
