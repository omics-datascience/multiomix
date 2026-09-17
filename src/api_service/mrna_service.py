import logging
from typing import Any, cast, Dict, List, Optional
from django.conf import settings

import bioapi_sdk
from bioapi_sdk import (
    CorrectionMethod,
    GeneTermRelationType,
    GeneTermsFilterType,
    OntologyType,
    PathwaySource,
    TermRelationType,
)
import modulector_sdk as modulector
from modulector_sdk import PaginatedResponse


class MRNAService(object):
    url_bioapi_prefix: str
    _modulector_base_url: str

    def __init__(self):
        bioapi_settings = settings.BIOAPI_SETTINGS
        self.url_bioapi_prefix = self.__build_url(bioapi_settings)
        self._modulector_base_url = settings.MODULECTOR_BASE_URL

    @staticmethod
    def __build_url(svc_settings: Dict[str, Any]) -> str:
        """
        Constructs the URL based on the settings provided.
        If the port is the default for the protocol (80 for http, 443 for https), it is omitted.
        Otherwise, the port is included in the URL.
        @param svc_settings: Dictionary containing protocol, host, and port information.
        @return: Constructed URL as a string.
        """
        protocol = svc_settings['protocol']
        host = svc_settings['host']
        port = svc_settings['port']

        if (protocol == 'http' and port == 80) or (protocol == 'https' and port == 443):
            return f"{protocol}://{host}"
        else:
            return f"{protocol}://{host}:{port}"

    # ------------------------------------------------------------------ #
    # Modulector SDK wrappers                                              #
    # ------------------------------------------------------------------ #

    def _paginated_to_dict(self, result: Optional[PaginatedResponse]) -> Dict:
        """Converts a SDK PaginatedResponse to the dict format expected by the frontend."""
        if result is None:
            return {'count': 0, 'next': '', 'previous': '', 'results': []}
        return {
            'count': result.count,
            'next': result.next or '',
            'previous': result.previous or '',
            'results': list(result.results or []),
        }

    def get_mirna_details(self, mirna: str) -> Optional[Dict]:
        """Get miRNA details from Modulector SDK."""
        try:
            return modulector.get_mirna_details(mirna=mirna, base_url=self._modulector_base_url)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_methylation_details(self, methylation_site: str) -> Optional[Dict]:
        """Get methylation site details from Modulector SDK."""
        try:
            return modulector.get_methylation_details(
                methylation_site=methylation_site,
                base_url=self._modulector_base_url
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_mirna_target_interactions(
            self,
            mirna: Optional[str] = None,
            gene: Optional[str] = None,
            score: Optional[str] = None,
            include_pubmeds: bool = False,
            page: Optional[int] = None,
            page_size: Optional[int] = None,
    ) -> Dict:
        """Get miRNA-target interactions from Modulector SDK."""
        try:
            result = modulector.get_mirna_target_interactions(
                mirna=mirna,
                gene=gene,
                score=float(score) if score else None,
                include_pubmeds=include_pubmeds,
                page=page,
                page_size=page_size,
                base_url=self._modulector_base_url,
            )
            return self._paginated_to_dict(result)
        except Exception as ex:
            logging.exception(ex)
            return self._paginated_to_dict(None)

    def get_diseases(self, mirna: Optional[str] = None, page: Optional[int] = None,
                     page_size: Optional[int] = None) -> Dict:
        """Get miRNA disease associations from Modulector SDK."""
        try:
            result = modulector.get_diseases(
                mirna=mirna,
                page=page,
                page_size=page_size,
                base_url=self._modulector_base_url,
            )
            return self._paginated_to_dict(result)
        except Exception as ex:
            logging.exception(ex)
            return self._paginated_to_dict(None)

    def get_drugs(self, mirna: Optional[str] = None, page: Optional[int] = None,
                  page_size: Optional[int] = None) -> Dict:
        """Get drug/miRNA associations from Modulector SDK."""
        try:
            result = modulector.get_drugs(
                mirna=mirna,
                page=page,
                page_size=page_size,
                base_url=self._modulector_base_url,
            )
            return self._paginated_to_dict(result)
        except Exception as ex:
            logging.exception(ex)
            return self._paginated_to_dict(None)

    def get_mirna_codes(self, mirna_codes: List[str]) -> Optional[Dict[str, Optional[str]]]:
        """Resolve miRNA identifiers to standard codes via Modulector SDK."""
        try:
            return modulector.get_mirna_codes(
                mirna_codes=mirna_codes,
                base_url=self._modulector_base_url,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def find_mirna_codes(self, query: str, limit: Optional[int] = None) -> List[str]:
        """Search miRNA identifiers via Modulector SDK."""
        try:
            return modulector.find_mirna_codes(query=query, limit=limit, base_url=self._modulector_base_url)
        except Exception as ex:
            logging.exception(ex)
            return []

    def get_methylation_sites(self, methylation_sites: List[str]) -> Optional[Dict[str, List[str]]]:
        """Resolve methylation site identifiers to EPIC 2.0 names via Modulector SDK."""
        try:
            return modulector.get_methylation_sites(
                methylation_sites=methylation_sites,
                base_url=self._modulector_base_url,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def find_methylation_sites(self, query: str, limit: Optional[int] = None) -> List[str]:
        """Search methylation site identifiers via Modulector SDK."""
        try:
            return modulector.find_methylation_sites(query=query, limit=limit, base_url=self._modulector_base_url)
        except Exception as ex:
            logging.exception(ex)
            return []

    # ------------------------------------------------------------------ #
    # BioAPI SDK wrappers                                                  #
    # ------------------------------------------------------------------ #

    def get_gene_symbols(self, gene_ids: List[str]) -> Optional[Dict[str, List[str]]]:
        """Validate gene identifiers and get their HGNC-approved symbols via BioAPI SDK."""
        try:
            return bioapi_sdk.gene_symbols(gene_ids=gene_ids, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def find_gene_symbols(self, query: str, limit: int = 50) -> List[str]:
        """Search gene symbols via BioAPI SDK."""
        try:
            return bioapi_sdk.gene_symbols_finder(query=query, limit=limit, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return []

    def get_gene_information(self, gene_ids: List[str]) -> Optional[Dict]:
        """Get genomic and database information for genes via BioAPI SDK."""
        try:
            return bioapi_sdk.information_of_genes(gene_ids=gene_ids, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_genes_of_its_group(self, gene_id: str) -> Optional[Dict]:
        """Get the HGNC gene group information for a gene via BioAPI SDK."""
        try:
            return bioapi_sdk.genes_of_its_group(gene_id=gene_id, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_pathways_in_common(self, gene_ids: List[str]) -> Optional[Dict]:
        """Get metabolic pathways common to a list of genes via BioAPI SDK."""
        try:
            return bioapi_sdk.pathways_in_common(gene_ids=gene_ids, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_pathway_genes(self, source: str, external_id: str) -> Optional[Dict]:
        """Get genes involved in a metabolic pathway via BioAPI SDK."""
        try:
            return bioapi_sdk.pathway_genes(
                source=cast(PathwaySource, source),
                external_id=external_id,
                base_url=self.url_bioapi_prefix,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_genes_to_terms(
            self,
            gene_ids: List[str],
            filter_type: str = 'intersection',
            relation_type: Optional[List[str]] = None,
            ontology_type: Optional[List[str]] = None,
            p_value_threshold: Optional[float] = None,
            correction_method: Optional[str] = None,
    ) -> Optional[List[Dict]]:
        """Get Gene Ontology terms related to a list of genes via BioAPI SDK."""
        try:
            return bioapi_sdk.genes_to_terms(
                gene_ids=gene_ids,
                filter_type=cast(GeneTermsFilterType, filter_type),
                relation_type=cast(Optional[List[GeneTermRelationType]], relation_type),
                ontology_type=cast(Optional[List[OntologyType]], ontology_type),
                p_value_threshold=p_value_threshold,
                correction_method=cast(Optional[CorrectionMethod], correction_method),
                base_url=self.url_bioapi_prefix,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_related_terms(
            self,
            term_id: str,
            relations: Optional[List[str]] = None,
            ontology_type: Optional[List[str]] = None,
            general_depth: Optional[int] = None,
            hierarchical_depth_to_children: Optional[int] = None,
            to_root: Optional[bool] = None,
    ) -> Optional[List[Dict]]:
        """Get Gene Ontology terms related to a term via BioAPI SDK."""
        try:
            return bioapi_sdk.related_terms(
                term_id=term_id,
                relations=cast(Optional[List[TermRelationType]], relations),
                ontology_type=cast(Optional[List[OntologyType]], ontology_type),
                general_depth=general_depth,
                hierarchical_depth_to_children=hierarchical_depth_to_children,
                to_root=to_root,
                base_url=self.url_bioapi_prefix,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_oncokb_information(self, gene_ids: List[str], query: Optional[str] = None) -> Optional[Dict]:
        """Get OncoKB cancer evidence and precision therapy data for genes via BioAPI SDK."""
        try:
            return bioapi_sdk.information_of_oncokb(gene_ids=gene_ids, query=query, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_drugs_pharm_gkb(self, gene_ids: List[str]) -> Optional[Dict]:
        """Get PharmGKB cancer-related drug labels for genes via BioAPI SDK."""
        try:
            return bioapi_sdk.drugs_pharm_gkb(gene_ids=gene_ids, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_string_relations(self, gene_id: str, min_combined_score: Optional[int] = None) -> Optional[List[Dict]]:
        """Get STRING functional association relations for a gene via BioAPI SDK."""
        try:
            return bioapi_sdk.string_relations(
                gene_id=gene_id,
                min_combined_score=min_combined_score,
                base_url=self.url_bioapi_prefix,
            )
        except Exception as ex:
            logging.exception(ex)
            return None

    def get_drugs_regulating_gene(self, gene_id: str) -> Optional[Dict]:
        """Get a DrugBank link listing drugs that regulate a gene via BioAPI SDK."""
        try:
            return bioapi_sdk.drugs_regulating_gene(gene_id=gene_id, base_url=self.url_bioapi_prefix)
        except Exception as ex:
            logging.exception(ex)
            return None


global_mrna_service = MRNAService()