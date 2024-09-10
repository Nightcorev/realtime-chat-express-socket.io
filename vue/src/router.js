import { createRouter, createWebHistory } from 'vue-router';
import MessagePage from './components/MessagePage.vue';
import LoginPage from './components/LoginPage.vue';

const routes = [
  { path: '/', component: MessagePage },
  { path: '/login', component: LoginPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router
