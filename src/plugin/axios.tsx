import axios from "axios";

axios.defaults.baseURL = `${import.meta.env.VITE_URL}api/v1/`
axios.defaults.headers.get['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.get['Authorization'] = 'Token ' + localStorage.getItem('accessToken');
axios.defaults.headers.delete['Authorization'] = 'Token ' + localStorage.getItem('accessToken');
axios.defaults.headers.put['Authorization'] = 'Token ' + localStorage.getItem('accessToken');
axios.defaults.headers.patch['Authorization'] = 'Token ' + localStorage.getItem('accessToken');
axios.defaults.headers.common['Authorization'] = `Token ${localStorage.getItem('accessToken')}`;


export default axios;