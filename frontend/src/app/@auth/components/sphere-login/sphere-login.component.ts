import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { SphereAuthService } from '../../sphere-auth.service';

@Component({
  selector: 'app-sphere-login',
  templateUrl: './sphere-login.component.html',
  styleUrls: ['./sphere-login.component.scss']
})
export class SphereLoginComponent implements OnInit {

  sphereLoginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private sphereAuthService: SphereAuthService,
    private router: Router
  ) {
    this.sphereLoginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if already authenticated to SPHERE
    if (this.sphereAuthService.isSphereAuthenticated()) {
      this.successMessage = 'Already authenticated to SPHERE';
    }
  }

  onSubmit(): void {
    if (this.sphereLoginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { username, password } = this.sphereLoginForm.value;

      this.authService.loginWithSphere(username, password)
        .then((response) => {
          this.isLoading = false;
          this.successMessage = 'SPHERE login successful! Token received.';
          console.log('SPHERE login response:', response);
          
          // Redirect to home or dashboard after successful login
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        })
        .catch((error) => {
          this.isLoading = false;
          this.errorMessage = `SPHERE login failed: ${error.message || error}`;
          console.error('SPHERE login error:', error);
        });
    } else {
      this.errorMessage = 'Please fill in all required fields';
    }
  }

  onReset(): void {
    this.sphereLoginForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Test method to check current authentication state
  checkSphereAuth(): void {
    const isAuth = this.sphereAuthService.isSphereAuthenticated();
    const token = this.sphereAuthService.getSphereToken();
    
    console.log('SPHERE Authentication Status:', isAuth);
    console.log('SPHERE Token:', token ? `${token.substring(0, 20)}...` : 'None');
    
    this.successMessage = `SPHERE Auth: ${isAuth ? 'Authenticated' : 'Not Authenticated'}`;
  }
} 