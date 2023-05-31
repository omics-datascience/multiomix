from django.http import HttpRequest
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service


class GeneInformation(APIView):
    """Retrieves general data of a gene from BioAPI."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        gene = request.GET.get('gene')
        data = global_mrna_service.get_bioapi_service_content(
            'methylation-sites',
            request_params={
                'gene_ids': [gene]
            },
            is_paginated=False,
            method='post'
        )

        if data:
            return Response(data)

        return Response({})
