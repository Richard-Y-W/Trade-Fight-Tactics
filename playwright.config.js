import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:90000,workers:1,use:{channel:'msedge',baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:1050},headless:true},reporter:'list',outputDir:'test-results',webServer:{command:'node server.mjs',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:15000}});
