import logging
from typing import Optional, Union
from django.contrib.auth.base_user import AbstractBaseUser
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, logout, login
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django_email_verification import sendConfirm
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer
from django.conf import settings
from django.db import transaction, InternalError


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


def login_action(request):
    """Login view"""
    if request.user.is_authenticated:
        return redirect('index')

    return render(request, "frontend/login.html")


def view_bad_credentials(request):
    """Returns login template with bad credential error in Its context"""
    return render(request, "frontend/login.html", {'loginError': 'Your username or password is invalid'})


def authenticate_action(request):
    """Authentication view"""
    username: Optional[str] = request.POST.get('username')
    password: Optional[str] = request.POST.get('password')
    if username is None or password is None:
        return view_bad_credentials(request)

    user: Union[AbstractBaseUser, AbstractBaseUser, None] = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        # If 'next' param is specified, it redirects to that URL
        next_url = request.POST.get('next')
        return redirect(next_url if next_url is not None else 'index')
    else:
        # Checks if User is active
        try:
            user: User = User.objects.get(username=username)
            if user is not None and not user.is_active:
                return render(
                    request,
                    "frontend/login.html",
                    {
                        'loginWarning': 'Your account has not been validated yet. Please, check your email account for '
                                        'our verification email'
                    }
                )
            return view_bad_credentials(request)
        except User.DoesNotExist:
            return view_bad_credentials(request)


def is_sign_up_form_valid(username: str, email: str, password: str, password_repeated: str) -> bool:
    """
    Checks if Sign Up form is valid
    @param username: Username to check
    @param email: Email to check
    @param password: Password to check
    @param password_repeated: Repeated password to check
    @return: True if is all the field valid. False otherwise
    """
    password_striped = password.strip()
    password_repeated_striped = password_repeated.strip()
    return len(username.strip()) > 0 \
        and len(email.strip()) > 0 \
        and len(password_striped) > 0 \
        and len(password_repeated_striped) > 0 \
        and password_striped == password_repeated_striped


def user_already_exists_username(username: str) -> bool:
    """
    Check if exists any user in the DB with the same username passed by parameter
    @param username: Username to check
    @return: True if exists the user. False otherwise
    """
    return User.objects.filter(username=username).exists()


def user_already_exists_email(email: str) -> bool:
    """
    Check if exists any user in the DB with the same email passed by parameter
    @param email: Email to check
    @return: True if exists the user. False otherwise
    """
    return User.objects.filter(email=email).exists()


@transaction.atomic
def create_user_action(request):
    """User creation view"""
    username: str = request.POST.get('newUsername', '')
    email: str = request.POST.get('email', '')
    password: str = request.POST.get('newPassword', '')
    password_repeated: str = request.POST.get('newPasswordRepeated', '')
    if not is_sign_up_form_valid(username, email, password, password_repeated):
        return render(request, "frontend/login.html", {'loginError': 'Invalid fields'})

    if user_already_exists_username(username):
        return render(request, "frontend/login.html", {'loginError': 'There is already a user with that username'})

    if user_already_exists_email(email):
        return render(request, "frontend/login.html", {'loginError': 'There is already a user with that email'})

    # If it's set to not send an email asking for confirmation just creates the user and redirect to login
    if not settings.EMAIL_NEW_USER_CONFIRMATION_ENABLED:
        User.objects.create_user(username, email, password)
        return render(request, "frontend/login.html", {'loginSuccess': 'User created successfully'})

    # Creates the user and sends email
    # FIXME: library does not return exceptions thrown in sender thread. After a PR it should be tested
    error_sending_email = False
    try:
        with transaction.atomic():
            user = User.objects.create_user(username, email, password)
            try:
                sendConfirm(user)
            except Exception as ex:
                logging.warning(f'Error sending email -> {ex}')
                raise InternalError  # Rollback
    except InternalError:
        error_sending_email = True

    if error_sending_email:
        return render(request, "frontend/login.html", {'loginError': 'An error have occurred. Please, try again. If the'
                                                                     ' problem persists contact us, please'})

    # Hides email
    idx_at = email.index('@')
    idx_to_replace = idx_at - 2
    hidden_email = '*' * idx_to_replace + email[idx_to_replace:]

    return render(
        request,
        "frontend/login.html",
        {'loginWarning': f'We have sent a confirmation email to {hidden_email}'}
    )


def test_new_user_email(request):
    """
    To test new user email template in browser. Only accessible in DEBUG mode
    @param request: Request object
    @return: HTTP Response
    """
    return render(request, settings.EMAIL_MAIL_HTML, {'link': '#'})


def test_confirmation_email(request):
    """
    To test confirmation email template in browser. Only accessible in DEBUG mode
    @param request: Request object
    @return: HTTP Response
    """
    return render(request, settings.EMAIL_PAGE_TEMPLATE, {'success': True})


def logout_action(request):
    """Closes User session"""
    logout(request)
    return redirect('index')


class CurrentUserView(APIView):
    """Gets current User info"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
