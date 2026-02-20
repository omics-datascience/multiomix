from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework import permissions
from typing import List, Optional, Dict
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from rest_framework.request import Request
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from biomarkers.models import Biomarker, BiomarkerState, BiomarkerOrigin
from biomarkers.serializers import BiomarkerSerializer, BiomarkerSimpleSerializer, BiomarkerSimpleUpdateSerializer
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404
from django.db.models import Q

def index_action(request):
    """Index view"""
    return render(request, "frontend/index.html")


def about_us_action(request):
    """About us view"""
    return render(request, "frontend/about-us.html")


def terms_and_privacy_policy_action(request):
    """Site policy view"""
    return render(request, "frontend/site-policy.html")


@login_required
def gem_action(request):
    """GEM analysis view"""
    return render(
        request,
        "frontend/gem.html",
        {
            'maximum_number_of_open_tabs': settings.MAX_NUMBER_OF_OPEN_TABS,
            'threshold_to_consider_ordinal': settings.THRESHOLD_ORDINAL
        }
    )


@login_required
def datasets_action(request):
    """Datasets Manager view"""
    return render(request, "frontend/datasets.html")


@login_required
def survival_action(request):
    """Survival Analysis view"""
    return render(request, "frontend/survival.html")

@login_required
def biomarker(request):
    """Biomarker view"""
    return render(request, "frontend/biomarker.html")

@login_required
def differential_expression(request):
    """Differential expression experiment view"""
    return render(
        request,
        "frontend/differential-expression.html",
        {
            'maximum_number_of_open_tabs': settings.MAX_NUMBER_OF_OPEN_TABS,
            'threshold_to_consider_ordinal': settings.THRESHOLD_ORDINAL
        }
    )


def open_source(request):
    """Open source view"""
    return render(request, "frontend/open-source.html")
