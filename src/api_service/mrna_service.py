import logging
from json.decoder import JSONDecodeError
from typing import Dict, Optional, Literal
import requests
from django.conf import settings
from django.http import QueryDict
from requests.exceptions import ConnectionError


class MRNAService(object):
    url_modulector_prefix: str
    url_bioapi_prefix: str

    def __init__(self):
        modulector_settings = settings.MODULECTOR_SETTINGS
        self.url_modulector_prefix = f"http://{modulector_settings['host']}:{modulector_settings['port']}"

        bioapi_settings = settings.BIOAPI_SETTINGS
        self.url_bioapi_prefix = f"http://{bioapi_settings['host']}:{bioapi_settings['port']}"

    @staticmethod
    def __generate_rest_query_params(get_request: QueryDict) -> str:
        """
        Generates a string with all the query params from GET request
        @param get_request: GET request with query params to send to DRF backend
        @return: String to send to Modulector/BioAPI APIs
        """
        return '&'.join([f'{key}={value}' for (key, value) in get_request.items()])

    def __get_service_content(
            self,
            service_name: str,
            request_params: QueryDict,
            is_paginated: bool,
            url_prefix: str,
            method: Literal['get', 'post']
    ) -> Optional[Dict]:
        """
        Generic function to make a request to a Modulector/BioAPI service
        @param service_name: Modulector/BioAPI service to consume
        @param request_params: GET/POST request with query params to send to DRF backend
        @param is_paginated: True if the expected response is paginated to generate a default response in case of error
        @param url_prefix: URL of the Modulector or BioAPI service
        @param method: Request method (GET or POST)
        @return: JSON data retrieved from the Modulector service. None if response has 404 status code
        """
        url = f'{url_prefix}/{service_name}'

        data = None  # Prevents Mypy warning
        try:
            if method == 'get':
                params = self.__generate_rest_query_params(request_params)
                if params:
                    url += f'/?{params}'
                data = requests.get(url)
            else:
                data = requests.post(url, json=request_params)

            if data.status_code == 404:
                return None

            return data.json()
        except (ConnectionError, JSONDecodeError) as ex:
            logging.exception(ex)
            logging.error(f'Received data from Modulector: {data}')

            if is_paginated:
                return {
                    'count': 0,
                    'next': '',
                    'previous': '',
                    'results': []
                }
            return None

    def get_modulector_service_content(
            self,
            service_name: str,
            request_params: QueryDict,
            is_paginated: bool,
            method: Literal['get', 'post'] = 'get'
    ) -> Optional[Dict]:
        """
        Makes a request to a Modulector service
        @param service_name: Modulector service to consume
        @param request_params: GET/POST params with query params to send to DRF backend
        @param is_paginated: True if the expected response is paginated to generate a default response in case of error
        @param method: Request method (GET or POST)
        @return: JSON data retrieved from the Modulector service. None if response has 404 status code
        """
        return self.__get_service_content(service_name, request_params, is_paginated, self.url_modulector_prefix, method)

    def get_bioapi_service_content(
            self,
            service_name: str,
            request_params: QueryDict,
            is_paginated: bool,
            method: Literal['get', 'post'] = 'get'
    ) -> Optional[Dict]:
        """
        Makes a request to a BioAPI service
        @param service_name: BioAPI service to consume
        @param request_params: GET/POST params with query params to send to DRF backend
        @param is_paginated: True if the expected response is paginated to generate a default response in case of error
        @param method: Request method (GET or POST)
        @return: JSON data retrieved from the Modulector service. None if response has 404 status code
        """
        return self.__get_service_content(service_name, request_params, is_paginated, self.url_bioapi_prefix, method)


global_mrna_service = MRNAService()
