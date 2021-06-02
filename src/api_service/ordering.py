from django.db.models.functions import Abs
from django.db.models.query import QuerySet
from rest_framework.filters import OrderingFilter


def annotate_by_correlation(queryset: QuerySet) -> QuerySet:
    """
    Generates an aggregated field from the absolute value of the correlation
    @param queryset: QuerySet to add the new field
    @return: QuerySet with the new field
    """
    return queryset.annotate(abs_correlation=Abs('correlation'))


class CustomExperimentResultCombinationsOrdering(OrderingFilter):
    """Custom class for ordering considering absolute value of correlation"""
    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if ordering:
            for i, sort_field in enumerate(ordering):
                stripped = sort_field.strip('-')
                # If the user is sorting by correlation, computes its absolute value and sorts
                if stripped == 'correlation':
                    queryset = annotate_by_correlation(queryset)
                    order = '-' if sort_field[0] == '-' else ''
                    ordering[i] = f'{order}abs_correlation'
            return queryset.order_by(*ordering)

        return queryset
