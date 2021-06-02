import logging
from json.decoder import JSONDecodeError
from typing import Dict, Optional
import requests
from django.conf import settings
from django.http import QueryDict
from requests.exceptions import ConnectionError


class MRNAService(object):
    url_prefix: str

    def __init__(self):
        modulector_settings = settings.MODULECTOR_SETTINGS
        self.url_prefix = f"http://{modulector_settings['host']}:{modulector_settings['port']}"

    @staticmethod
    def __generate_rest_query_params(get_request: QueryDict) -> str:
        """
        Generate a string with all the query params from GET request
        @param get_request: GET request with query params to send to DRF backend
        @return: String to send to Modulecto API
        """
        return '&'.join([f'{key}={value}' for (key, value) in get_request.items()])

    def get_modulector_service_content(
        self,
        service_name: str,
        get_request: QueryDict,
        is_paginated: bool
    ) -> Optional[Dict]:
        """
        Generic function to make a request to a Modulector service
        @param service_name: Modulector service to consume
        @param get_request: GET request with query params to send to DRF backend
        @param is_paginated: True if the expected response is paginated to generate a default response in case of error
        @return: JSON data retrieved from the Modulector service. None if response has 404 status code
        """
        params = self.__generate_rest_query_params(get_request)
        url = f'{self.url_prefix}/{service_name}/?{params}'
        data = None  # Prevents Mypy warning
        try:
            data = requests.get(url)
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


global_mrna_service = MRNAService()
