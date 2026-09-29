import json
from types import SimpleNamespace
from unittest.mock import patch

import requests
from django.test import RequestFactory, SimpleTestCase
from django.urls import reverse

from api_service.mrna_service import MRNAService
from api_service.views import get_mirna_target_validation_action


class MirnaTargetValidationTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def request(self, params):
        request = self.factory.get(reverse('mirna_target_validation'), params)
        request.user = SimpleNamespace(is_authenticated=True)
        return request

    def test_requires_mirna_or_target(self):
        response = get_mirna_target_validation_action(self.request({}))
        self.assertEqual(response.status_code, 400)

    def test_only_accepts_get(self):
        request = self.factory.post(reverse('mirna_target_validation'))
        request.user = SimpleNamespace(is_authenticated=True)
        response = get_mirna_target_validation_action(request)
        self.assertEqual(response.status_code, 405)

    def test_forwards_validated_filters_and_returns_paginated_data(self):
        page = {'count': 1, 'next': '', 'previous': '', 'results': [{'gene': 'SLC7A1'}]}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({
                'mirna': 'hsa-miR-122-5p',
                'target': 'SLC7A1',
                'support_type': 'Functional MTI',
                'page': '2',
                'page_size': '20',
                'ordering': '-gene',
            }))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), page)
        get_data.assert_called_once_with(
            mirna='hsa-miR-122-5p', target='SLC7A1',
            support_type='Functional MTI', page=2, page_size=20, ordering='-gene',
        )

    def test_rejects_invalid_support_type(self):
        response = get_mirna_target_validation_action(self.request({
            'mirna': 'hsa-miR-122-5p', 'support_type': 'unknown'
        }))
        self.assertEqual(response.status_code, 400)

    def test_accepts_target_without_mirna(self):
        page = {'count': 0, 'next': '', 'previous': '', 'results': []}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))

        self.assertEqual(response.status_code, 200)
        get_data.assert_called_once_with(target='SLC7A1')

    def test_rewrites_upstream_pagination_links_to_local_route(self):
        page = {
            'count': 11,
            'next': 'https://web/mirna-target-validation/?target=SLC7A1&page=2',
            'previous': '',
            'results': [],
        }
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page):
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content)['next'],
            f"{reverse('mirna_target_validation')}?target=SLC7A1&page=2",
        )

    def test_rejects_page_size_above_sdk_limit(self):
        response = get_mirna_target_validation_action(self.request({
            'target': 'SLC7A1', 'page_size': '1001'
        }))
        self.assertEqual(response.status_code, 400)

    def test_accepts_multi_field_ordering(self):
        page = {'count': 0, 'next': '', 'previous': '', 'results': []}
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations', return_value=page) as get_data:
            response = get_mirna_target_validation_action(self.request({
                'target': 'SLC7A1', 'ordering': 'mirna, -gene'
            }))
        self.assertEqual(response.status_code, 200)
        get_data.assert_called_once_with(target='SLC7A1', ordering='mirna,-gene')

    def test_upstream_failure_is_not_reported_as_no_data(self):
        with patch('api_service.views.global_mrna_service.get_mirna_target_validations',
                   side_effect=requests.Timeout), \
             patch('api_service.views.logging.exception'):
            response = get_mirna_target_validation_action(self.request({'target': 'SLC7A1'}))
        self.assertEqual(response.status_code, 502)

    @patch('api_service.mrna_service.modulector.get_mirna_target_validations')
    def test_service_calls_sdk(self, get_validations):
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
