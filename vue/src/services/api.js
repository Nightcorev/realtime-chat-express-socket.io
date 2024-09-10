import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
});

export default {
    getUsers(userId) {
        return api.get('/users', { params: { id: userId } });
    },
    getMessages() {
        return api.get('/messages');
    },
    getMessagesByContact(contactId) {
        return api.get(`/messages/${contactId}`);
    },
    getProfile() {
        return api.get('/auth/get-profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    }
};

