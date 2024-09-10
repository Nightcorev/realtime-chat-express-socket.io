<template>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header text-center">
              <h4>Login</h4>
            </div>
            <div class="card-body">

              <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                <div class="d-flex align-items-center">
                  <i class="fa-regular fa-circle-xmark me-2 fa-2x" style="color: red;"></i>
                  <span class="flex-grow-1">{{ errorMessage }}</span>
                </div>
              </div>
  
              <form @submit.prevent="handleLogin">
                <div class="form-group mb-3">
                  <label for="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    v-model="username"
                    class="form-control"
                    required
                  />
                </div>
                <div class="form-group mb-3">
                  <label for="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    v-model="password"
                    class="form-control"
                    required
                  />
                </div>
                <div class="form-group mb-3">
                    <a href="#"><h7>Forgot Password?</h7></a>
                </div>
                <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                <span v-if="!isLoading">Login</span>
              </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        username: '',
        password: '',
        isLoading: false,
        errorMessage: ''
      };
    },
    methods: {
      async handleLogin() {
        this.isLoading = true;
        setTimeout(async () => {
          try {
            const response = await axios.post('http://localhost:5000/auth/login', {
              username: this.username,
              password: this.password
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            const user = JSON.parse(localStorage.getItem('user'));
            const id_role = user ? user.id_role : null;
            if (id_role == 2) {
              this.$router.push('/order-cashier').then(() => {
                this.$nextTick(() => {
                  window.location.reload();
                });
              });
            }else if (id_role == 3) {
              this.$router.push('/statistics').then(() => {
                this.$nextTick(() => {
                  window.location.reload();
                });
              });
            }else {
              this.$router.push('/').then(() => {
                this.$nextTick(() => {
                  window.location.reload();
                });
              });
            }
          } catch (error) {
            this.errorMessage = error.response?.data?.message || 'An error occurred';
          } finally {
            this.isLoading = false;
          }
        }, 2000);
      }
    },
    
  };
  </script>
  
  