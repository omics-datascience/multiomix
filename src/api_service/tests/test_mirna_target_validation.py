import json
from types import SimpleNamespace
from unittest.mock import patch

import requests
from django.test import RequestFactory, SimpleTestCase
from django.urls import reverse

from api_service.mrna_service import MRNAService
from api_service.serializers import MirnaTargetValidationSerializer
from api_service.views import get_mirna_target_validation_action


class MirnaTargetValidationTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def request(self, params):
        request = self.factory.get(reverse('mirna_target_validation'), params)
        request.user = SimpleNamespace(is_authenticated=True)
        return request

    def test_requires_mirna_or_target(self):
        """The endpoint rejects requests that cannot identify a miRNA-target pair."""
        response = get_mirna_target_validation_action(self.request({}))
        self.assertEqual(response.status_code, 400)

    def test_only_accepts_get(self):
        """The endpoint only permits GET requests."""
        request = self.factory.post(reverse('mirna_target_validation'))
        request.user = SimpleNamespace(is_authenticated=True)
        response = get_mirna_target_validation_action(request)
        self.assertEqual(response.status_code, 405)

    def test_forwards_query_parameters_and_serializes_paginated_results(self):
        """The view forwards query parameters and returns read-only serialized records."""
        result = {
            'id': 1,
            'mirtarbase_id': 'MIRT000001',
            'mirna': 'hsa-miR-122-5p',
            'gene': 'SLC7A1',
            'target_gene_entrez_id': '10558',
            'experiments': ['Western blot'],
            'support_type': 'Functional MTI',
            'pmid': '12345678',
        }
        page = {'count': 1, 'next': '', 'previous': '', 'results': [result]}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({
                'mirna': 'hsa-miR-122-5p',
                'target': 'SLC7A1',
                'support_type': 'Functional MTI',
                'experiment': 'Western blot',
                'page': '2',
                'page_size': '20',
                'ordering': '-gene',
            }))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), page)
        get_data.assert_called_once_with(
            mirna='hsa-miR-122-5p', target='SLC7A1',
            support_type='Functional MTI', experiment='Western blot',
            page='2', page_size='20', ordering='-gene',
        )

    def test_accepts_target_without_mirna(self):
        """A target-only query is forwarded to Modulector and returns its empty page."""
        page = {'count': 0, 'next': '', 'previous': '', 'results': []}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))

        self.assertEqual(response.status_code, 200)
        get_data.assert_called_once_with(
            mirna=None, target='SLC7A1', support_type=None, experiment=None,
            ordering=None, page=None, page_size=None,
        )

    def test_preserves_upstream_pagination_links(self):
        """Pagination metadata from Modulector is returned without rewriting its links."""
        page = {
            'count': 11,
            'next': 'https://web/mirna-target-validation/?target=SLC7A1&page=2',
            'previous': '',
            'results': [],
        }
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page):
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), page)

    def test_accepts_multi_field_ordering(self):
        """The view forwards a multi-field ordering value to the SDK service."""
        page = {'count': 0, 'next': '', 'previous': '', 'results': []}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({
                'target': 'SLC7A1', 'ordering': 'mirna, -gene'
            }))
        self.assertEqual(response.status_code, 200)
        get_data.assert_called_once_with(
            mirna=None, target='SLC7A1', support_type=None, experiment=None,
            ordering='mirna, -gene', page=None, page_size=None,
        )

    def test_upstream_failure_is_not_reported_as_no_data(self):
        """An upstream service failure is reported as a gateway error, not an empty result."""
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations',
                   side_effect=requests.Timeout), \
             patch('api_service.views.logging.exception'):
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))
        self.assertEqual(response.status_code, 502)

    @patch('api_service.mrna_service.modulector.get_mirna_target_validations')
    def test_service_calls_sdk(self, get_validations):
        """The service forwards all supported miRTarBase filters and pagination to the SDK."""
        get_validations.return_value = SimpleNamespace(
            count=1, next=None, previous=None, results=[{'gene': 'SLC7A1'}]
        )
        result = MRNAService().get_mirna_target_validations(
            mirna='hsa-miR-122-5p', target='SLC7A1',
            support_type='Functional MTI', experiment='Western blot',
            ordering='-gene', page=1
        )

        self.assertEqual(result['results'], [{'gene': 'SLC7A1'}])
        self.assertEqual(result['count'], 1)
        self.assertEqual(get_validations.call_args.kwargs['target'], 'SLC7A1')
        self.assertEqual(get_validations.call_args.kwargs['support_type'], 'Functional MTI')
        self.assertEqual(get_validations.call_args.kwargs['experiment'], 'Western blot')
        self.assertEqual(get_validations.call_args.kwargs['ordering'], '-gene')
        self.assertEqual(get_validations.call_args.kwargs['page'], 1)

    def test_result_serializer_is_read_only(self):
        """The result serializer represents Modulector records without accepting writes."""
        record = {
            'id': 1,
            'mirtarbase_id': 'MIRT000001',
            'mirna': 'hsa-miR-122-5p',
            'gene': 'SLC7A1',
            'target_gene_entrez_id': None,
            'experiments': ['Western blot'],
            'support_type': 'Functional MTI',
            'pmid': None,
        }
        serializer = MirnaTargetValidationSerializer(data=record)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data, {})
