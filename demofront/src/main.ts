import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router"; // импортируем ваш роутер
import "./assets/index.css"; // убедитесь, что файл существует или закомментируйте

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount("#app");
