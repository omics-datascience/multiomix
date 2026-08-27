import logging
from json.decoder import JSONDecodeError
from typing import Any, Dict, List, Optional, Literal, Union
import requests
from django.conf import settings
from django.http import QueryDict
from requests.exceptions import ConnectionError

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

    @staticmethod
    def __generate_rest_query_params(get_request: QueryDict) -> str:
        """
        Generates a string with all the query params from GET request.
        @param get_request: GET request with query params to send to DRF backend
        @return: String to send to BioAPI
        """
        return '&'.join([f'{key}={value}' for (key, value) in get_request.items()])

    def __get_bioapi_content(
            self,
            service_name: str,
            request_params: QueryDict,
            is_paginated: bool,
            method: Literal['get', 'post'],
    ) -> Optional[Union[Dict, str]]:
        """
        Generic function to make a request to a BioAPI service.
        @param service_name: BioAPI service to consume
        @param request_params: GET/POST request with query params
        @param is_paginated: True if the expected response is paginated
        @param method: Request method (GET or POST)
        @return: JSON data retrieved from BioAPI. None if response has 404 status code
        """
        url = f'{self.url_bioapi_prefix}/{service_name}/'

        data = None  # Prevents Mypy warning
        try:
            if method == 'get':
                params = self.__generate_rest_query_params(request_params)
                if params:
                    url += f'/?{params}/'
                data = requests.get(url)
            else:
                data = requests.post(url, json=request_params)

            if data.status_code != 200:
                logging.warning(f'{method.upper()} to {url} returned status_code {data.status_code} and '
                                f'message: {data.content}')
                return None

            content_type = data.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                return data.json()
            elif 'text/plain' in content_type or 'text/html' in content_type:
                return data.text
            else:
                return None

        except (ConnectionError, JSONDecodeError) as ex:
            logging.error(f'Received data from BioAPI: {data}')
            logging.exception(ex)

            if is_paginated:
                return {
                    'count': 0,
                    'next': '',
                    'previous': '',
                    'results': []
                }
            return None

    def get_bioapi_service_content(
            self,
            service_name: str,
            request_params: QueryDict,
            is_paginated: bool,
            method: Literal['get', 'post'] = 'get'
    ) -> Optional[Any]:
        """
        Makes a request to a BioAPI service.
        @param service_name: BioAPI service to consume
        @param request_params: GET/POST params with query params to send to DRF backend
        @param is_paginated: True if the expected response is paginated
        @param method: Request method (GET or POST)
        @return: JSON data retrieved from BioAPI. None if response has 404 status code
        """
        return self.__get_bioapi_content(service_name, request_params, is_paginated, method)

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
            kwargs: Dict[str, Any] = {'query': query, 'base_url': self._modulector_base_url}
            if limit is not None:
                kwargs['limit'] = limit
            return modulector.find_mirna_codes(**kwargs)
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
            kwargs: Dict[str, Any] = {'query': query, 'base_url': self._modulector_base_url}
            if limit is not None:
                kwargs['limit'] = limit
            return modulector.find_methylation_sites(**kwargs)
        except Exception as ex:
            logging.exception(ex)
            return []


global_mrna_service = MRNAService()