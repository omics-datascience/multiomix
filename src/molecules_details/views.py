from random import randint
from typing import cast, Any

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
    http://localhost:8000/molecules/gene-information?gene=MSH3,BRCA1
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()

        if gene:
            gene = gene.split(',')
        else:
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})

        data = global_mrna_service.get_bioapi_service_content(
            'information-of-genes',
            request_params={
                'gene_ids': gene
            },
            is_paginated=False,
            method='post'
        )

        return Response({
            'data': data if data else None
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
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})

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
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})

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
        if not source:
            return Response(status=400, data={"error": "Param 'source' is mandatory"})

        pathway_id = request.GET.get('id', '').strip()
        if not pathway_id:
            return Response(status=400, data={"error": "Param 'id' is mandatory"})

        data = global_mrna_service.get_bioapi_service_content(
            f'/pathway-genes/{source}/{pathway_id}',
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
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})

        if not filter_type:
            filter_type = 'intersection'

        if filter_type not in ["intersection", "union", "enrichment"]:
            return Response(status=400, data={"error": "The 'filter_type' parameter must be one of the following "
                                                       "options: 'intersection', 'union' or 'enrichment'"})
        else:
            if filter_type == 'enrichment':
                if not p_value_threshold:
                    return Response(status=400, data={"error": "The 'p_value_threshold' parameter is mandatory if "
                                                               "'filter_type' is 'enrichment'"})
                if not correction_method:
                    return Response(status=400, data={"error": "The 'correction_method' parameter is mandatory if "
                                                               "'filter_type' is 'enrichment'"})
            else:
                if not relation_type:
                    relation_type = ["enables", "involved_in",
                                     "part_of", "located_in"]
                else:
                    relation_type = relation_type.split(',')
                    for relation in relation_type:
                        if relation not in ["enables", "involved_in", "part_of", "located_in"]:
                            return Response(status=400, data={"error": "The 'relation_type' parameter must be a "
                                                                       "combination of the following options: "
                                                                       "'enables', 'involved_in', 'part_of' and "
                                                                       "'located_in'"})
        if not ontology_type:
            ontology_type = ["biological_process",
                             "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type_elem in ontology_type:
                if type_elem not in ["biological_process", "molecular_function", "cellular_component"]:
                    return Response(status=400, data={"error": "The 'ontology_type' parameter must be a combination of "
                                                               "the following options: 'biological_process', "
                                                               "'molecular_function' and 'cellular_component'"})
        if filter_type in ["intersection", "union"]:
            data = global_mrna_service.get_bioapi_service_content(
                'genes-to-terms',
                # request_params={
                #     'gene_ids': [gene],
                #     'filter_type': filter_type,
                #     'ontology_type': ontology_type,
                #     'relation_type': relation_type
                # },
                # TODO: remove this and uncomment the above code when the bioapi service is fixed
                request_params={
                    "gene_ids": ["TMCO4"], "relation_type": ["enables"], "ontology_type": ["molecular_function"]
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
    def __process_go_data(go_terms: dict) -> dict:
        """
        Generates a structure with the GO terms data in a format ready-to-use for cytoscape frontend lib.
        @param go_terms: BioAPI GO data.
        @return: Processed GO data.
        """
        res = {'nodes': [], 'edges': []}
        if not go_terms:
            return res

        # Iterates over the GO terms and generates the nodes and edges
        for go_term in go_terms:
            node = {
                'data': {
                    'id': go_term['go_id'],
                    'name': go_term['name'],
                    'ontology_type': go_term['ontology_type']
                }
            }
            res['nodes'].append(node)

            for relation, target_go_ids in go_term['relations'].items():
                relation_type = cast(str, relation)

                for target_go_id in target_go_ids:
                    edge = {
                        'data': {
                            'source': go_term['go_id'],
                            'target': target_go_id,
                            'relation_type': relation_type
                        }
                    }
                    res['edges'].append(edge)

        return res

    def get(self, request: HttpRequest):
        term_id = request.GET.get('term_id', '').strip()
        if not term_id:
            return Response(status=400, data={"error": "Param 'term_id' is mandatory"})

        general_depth = request.GET.get('general_depth', '5').strip()
        if not general_depth:
            return Response(status=400, data={"error": "Param 'general_depth' is mandatory"})
        if not general_depth.isnumeric():
            return Response(status=400, data={"error": "Param 'general_depth' must be a numeric value"})

        hierarchical_depth_to_children = request.GET.get('hierarchical_depth_to_children', '0').strip()
        if hierarchical_depth_to_children:
            if not hierarchical_depth_to_children.isnumeric():
                return Response(status=400, data={"error": "Param 'hierarchical_depth_to_children' must be a "
                                                           "numeric value"})
            hierarchical_depth_to_children = int(hierarchical_depth_to_children)

        to_root = request.GET.get('to_root', '1').strip()
        if to_root:
            if to_root not in ["0", "1"]:
                return Response(status=400, data={"error": "Param 'to_root' must be '0' or '1'"})
            to_root = int(to_root)

        relations = request.GET.get('relations', '').strip()
        if not relations:
            relations = ["part_of", "regulates", "has_part"]
        else:
            relations = relations.split(',')
            for relation in relations:
                if relation not in ["part_of", "regulates", "has_part"]:
                    return Response(status=400, data={"error": "The 'relations' parameter must be a combination of "
                                                               "the following options: 'part_of', 'regulates' and "
                                                               "'has_part'"})

        ontology_type = request.GET.get('ontology_type', '').strip()
        if not ontology_type:
            ontology_type = ["biological_process",
                             "molecular_function", "cellular_component"]
        else:
            ontology_type = ontology_type.split(',')
            for type_elem in ontology_type:
                if type_elem not in ["biological_process", "molecular_function", "cellular_component"]:
                    return Response(status=400, data={"error": "The 'ontology_type' parameter must be a combination "
                                                               "of the following options: 'biological_process', "
                                                               "'molecular_function' and 'cellular_component'"})

        data = global_mrna_service.get_bioapi_service_content(
            'related-terms',
            request_params={
                'term_id': term_id,
                'relations': relations,
                'ontology_type': ontology_type,
                'general_depth': int(general_depth),
                'hierarchical_depth_to_children': hierarchical_depth_to_children,
                'to_root': to_root
            },
            is_paginated=False,
            method='post'
        )

        # Generates structure for cytoscape in frontend
        data = self.__process_go_data(data)

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
    http://localhost:8000/molecules/actionable-cancer-genes?gene=BRCA1,ATM&query=Olaparib
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        query = request.GET.get('query', '')

        if not gene:
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})
        else:
            gene = gene.split(',')

        if not query:
            query = ""

        data = global_mrna_service.get_bioapi_service_content(
            'information-of-oncokb',
            request_params={
                'gene_ids': gene,
                'query': query
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
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})
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
    http://localhost:8000/molecules/predicted-functional-associations-network?gene=MX2&score=996
    http://localhost:8000/molecules/predicted-functional-associations-network?gene=BRCA1&score=995
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __generate_node(association: dict[str, Any], id_key: str) -> dict[str, Any]:
        """
        TODO: complete
        @param association:
        @param id_key:
        @return:
        """
        return {
            'data': {
                'id': association[id_key],
                'name': association[id_key],
                'score': association['combined_score'],  # TODO: check, the size should be the same for all
                'query': True,
                'gene': True,
            },
            'group': 'nodes',
            'removed': False,
            'selected': False,
            'selectable': True,
            'locked': False,
            'grabbed': False,
            'grabbable': True,
            # TODO: Check if 'classes' can remove
            'classes': 'fn10273 fn6944 fn9471 fn10569 fn8023 fn6956 fn6935 fn8147 fn6939 fn6936 fn6629 fn7928 fn6947 fn8612 fn6957 fn8786 fn6246 fn9367 fn6945 fn6946 fn10024 fn10022 fn6811 fn9361 fn6279 fn6278 fn8569 fn7641 fn8568 fn6943'
        }

    @staticmethod
    def __generate_edge(association: dict[str, Any], source_key: str, target_key: str) -> dict[str, Any]:
        """

        @param association:
        @param source_key:
        @param target_key:
        @return:
        """
        return {
            'data': {
                'source': association[source_key],
                'target': association[target_key],
                # TODO: change weight to the neighborhood, fusion, cooccurence, experiments, textmining, database y coexpression value
                'weight': association['combined_score'],
                # TODO: compute group by neighborhood, fusion, cooccurence, experiments, textmining, database and
                # TODO: coexpression fields, the null ocurrence should be ignored. Must match with COLORS_BY_STRING_RELATION
                # TODO: constant in frontend
                'group': 'coexp' if randint(0, 10) > 5 else 'coloc',
                # 'networkId': 1103,
                # 'networkGroupId': 18,
                # 'intn': True,
                # 'rIntnId': 80,
                # 'id': 'e78'
            },
            'position': {},
            'group': 'edges',
            'removed': False,
            'selected': False,
            'selectable': True,
            'locked': False,
            'grabbed': False,
            'grabbable': True,
            # 'classes': ''
        }

    def __process_associations_data(self, associations: dict) -> list[dict]:
        """
        Generates a structure with the genes associations data in a format ready-to-use for cytoscape frontend lib.
        @param associations: BioAPI Gene  data.
        @return: Processed GO data.
        """
        if not associations:
            return []

        # Generates an array of the same length as the associations
        computed_genes: set[str] = set()
        res = []  # TODO: use Numpy array of len(associations) * 3
        # Iterates over the GO terms and generates the nodes and edges
        for association in associations:
            # Creates nodes for gene_1 and gene_2 if they are not in the computed_genes set
            if association['gene_1'] not in computed_genes:
                res.append(self.__generate_node(association, 'gene_1'))
                computed_genes.add(association['gene_1'])

            if association['gene_2'] not in computed_genes:
                res.append(self.__generate_node(association, 'gene_2'))
                computed_genes.add(association['gene_2'])

            # TODO: call __generate_edge for all the neighborhood, fusion, cooccurence, experiments, textmining, database and
            # coexpression fields, the null occurrences should be ignored
            res.append(self.__generate_edge(association, 'gene_1', 'gene_2'))

        # Returns the list sorted to get the group == 'nodes' first to prevent "missing node" error in the frontend
        return sorted(res, key=lambda x: x['group'] == 'nodes', reverse=True)

    def get(self, request: HttpRequest):
        gene_id = request.GET.get('gene_id', '').strip()
        min_combined_score = request.GET.get('min_combined_score', '').strip()
        if not gene_id:
            return Response(status=400, data={"error": "Param 'gene_id' is mandatory"})
        if not min_combined_score:
            return Response(status=400, data={"error": "Param 'min_combined_score' is mandatory"})

        if min_combined_score.isnumeric():
            if int(min_combined_score) < 1 or int(min_combined_score) > 1000:
                return Response(status=400, data={"error": "Param 'min_combined_score' must be a number within "
                                                           "the closed range 1-1000"})
        else:
            return Response(status=400, data={"error": "Param 'min_combined_score' must be a numeric value"})

        data = global_mrna_service.get_bioapi_service_content(
            'string-relations',
            request_params={
                'gene_id': gene_id,
                # 'min_combined_score': int(min_combined_score)
                'min_combined_score': 995
            },
            is_paginated=False,
            method='post'
        )

        # Generates structure for cytoscape in frontend
        data = self.__process_associations_data(data)

        return Response({'data': data})


class DrugsRegulatingGene(APIView):
    """
    Service that takes gene symbol and returns a link to https://go.drugbank.com with
    all the drugs that up-regulate and down regulate its expression.
    Examples:
    http://localhost:8000/molecules/drugs-regulating-gene?gene=TP53
    http://localhost:8000/molecules/drugs-regulating-gene?gene=EGFR
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene', '').strip()
        if not gene:
            return Response(status=400, data={"error": "Param 'gene' is mandatory"})

        data = global_mrna_service.get_bioapi_service_content(
            f'/drugs-regulating-gene/{gene}',
            request_params={},  # No params needed
            is_paginated=False,
            method='get'
        )
        return Response({
            'data': data["link"] if data and "link" in data else None
        })


class MethylationSiteInformation(APIView):
    """
    Retrieves general data of a methylation site from Modulector 'methylation' service.
    Examples:
    http://localhost:8000/molecules/methylation-site-information?methylation_site=cg22461615
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        methylation_site = request.GET.get('methylation_site', '').strip()

        if not methylation_site:
            return Response(status=400, data={"error": "Param 'methylation_site' is mandatory"})

        data = global_mrna_service.get_modulector_service_content(
            'methylation',
            request_params={
                'methylation_site': methylation_site
            },
            is_paginated=False,
            method='get'
        )

        return Response({
            'data': data if data else None
        })
