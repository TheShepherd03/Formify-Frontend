import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');

  // Clone the request and add the token if it exists
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token is invalid or expired, redirect to login
          console.log('Authentication error, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Use window.location instead of Router since we're in an interceptor
          window.location.href = '/auth/login';
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};
