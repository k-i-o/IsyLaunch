import './assets/main.less'

import { createApp } from 'vue'
import App from './App.vue'
import Tooltip from 'primevue/tooltip';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

const app = createApp(App);
app.directive('tooltip', Tooltip);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.mount('#app')
