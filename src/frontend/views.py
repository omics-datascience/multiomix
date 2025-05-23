from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings


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
