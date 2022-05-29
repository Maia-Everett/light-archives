import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Index.vue') }],
    meta: {
      title: ''
    }
  },

  {
    path: '/issue/:id([0-9]+)',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Issue.vue') }],
    meta: {
      title: ''
    }
  },

  {
    path: '/:year([0-9]{4})/:month([0-9]{2})/:day([0-9]{2})/:slug',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Article.vue') }],
    meta: {
      title: ''
    }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
    meta: {
      title: 'Error'
    },
  },
];

export default routes;
