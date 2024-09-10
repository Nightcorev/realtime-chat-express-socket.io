<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-3 bg-light p-3">
        <h4>Contacts</h4>
        <ul class="list-group">
          <li
            class="list-group-item"
            v-for="contact in contacts"
            :key="contact.id"
            :class="{ active: contact.id === selectedContactId }"
            @click="selectContact(contact.id)"
          >
          
            {{ contact.username || 'Unknown User' }}
            <span :class="{'badge bg-success': contact.isOnline, 'badge bg-secondary': !contact.isOnline}">
              {{ contact.isOnline ? 'Online' : 'Offline' }}
            </span>
            <div v-if="contact.last_message"> 
              <div v-if="contact.image">
                <i class="fa-solid fa-image"></i>
                <small class="text-muted">{{ contact.last_message }}</small>
                <span v-if="contact.is_sender === currentUser.id" style="color: skyblue;">&#10003;</span>
              </div>
              <div v-else>
                <small class="text-muted">{{ contact.last_message }}</small>
                <span v-if="contact.is_sender === currentUser.id" style="color: skyblue;">&#10003;</span>
              </div>
            </div>
            <div v-else>
              <div v-if="contact.image">
                <i class="fa-solid fa-image"></i>
                <small class="text-muted">{{ contact.image }}</small>
                <span v-if="contact.is_sender === currentUser.id" style="color: skyblue;">&#10003;</span>
              </div>
              <div v-else>
                <small class="text-muted">No messages yet {{ currentUser }}</small>
                <span v-if="contact.is_sender === currentUser.id" style="color: skyblue;">&#10003;</span>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="col-md-9 mt-4 d-flex flex-column chat-container">
        <div class="chat-header p-3 border">
          <h5>{{ selectedContact ? selectedContact.username : '' }}</h5>
          <small>{{ selectedContact ? selectedContact.nomor : '' }}</small>
        </div>

        <div class="chat-messages flex-grow-1 p-3 border overflow-auto">
          <div v-for="message in messages" :key="message.id" :class="['mb-2', message.sender_id === currentUser.id ? 'text-end' : 'text-start']">
            <div class="d-inline-block p-2 bg-secondary text-white rounded">
              <div v-if="message.image">
                <img :src="`http://localhost:5000/uploads/${message.image}`" alt="Image" class="img-fluid rounded" style="width: 15rem;"/>
                <div v-if="message.message_text" class="message-content">
                  {{ message.message_text }}
                </div>
              </div>
              <div v-else class="message-content">
                {{ message.message_text }}
              </div>
              <div class="d-flex justify-content-end mt-1" style="font-size: 0.7rem;">
                {{ formatTime(message.created_at) }}
                <span v-if="message.sender_id === currentUser.id" style="color: skyblue;">&#10003;</span>
              </div>
            </div>
          </div>
          <input type="file" id="fileInput" ref="fileInput" accept="image/*" style="display: none;" @change="handleFileChange" />
        </div>

        <div class="chat-input p-3 border-top">
          <div v-if="isModalVisible">
            <img v-if="imageUrl" :src="imageUrl" alt="Preview Image" class="img-fluid" style="max-width: 15rem;">
            <button class="btn btn-secondary" @click="closeModal">Close</button>
          </div>
          <div class="input-group">
            <button class="btn btn-light" @click="openFileDialog">
              <i class="fa-regular fa-image"></i>
            </button>
            <input type="text" class="form-control" v-model="newMessage"/>
            <button class="btn btn-primary" @click="sendMessage">Send</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
import api from '@/services/api';

export default {
  name: 'MessagePage',
  data() {
    return {
      contacts: [],
      messages: [],
      newMessage: '',
      socket: null,
      currentUser: { id: null },
      selectedContactId: null,
      selectedContact: null,
      isModalVisible: false,
      imageUrl: null,
      fileName: null,
      file: null
    };
  },
  async created() {
    this.socket = io('http://localhost:5000', {
      query: { userId: this.currentUser.id }
    });

    this.socket.on('chat message', (message) => {
      if (message.receiver_id === this.selectedContactId || message.sender_id === this.selectedContactId) {
        this.messages.push(message);
      }
    });

    this.socket.on('user status', (status) => {
      const contact = this.contacts.find(c => c.id === status.userId);
      if (contact) {
        contact.isOnline = status.status === 'online';
      }
    });
  },
  async mounted() {
    try {
      const response = await api.getProfile();
      this.currentUser = response.data.user;
      await this.fetchContacts();
      if (this.selectedContactId) {
        await this.fetchMessages();
      }
    } catch (error) {
      console.error('Failed to fetch user data from token', error);
    }
  },
  methods: {
    async fetchContacts() {
      try {
        const response = await api.getUsers(this.currentUser.id);
        this.contacts = response.data;
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    },
    async fetchMessages() {
      if (!this.selectedContactId) return;
      try {
        const response = await api.getMessagesByContact(this.selectedContactId);
        this.messages = response.data;
        this.selectedContact = this.contacts.find(contact => contact.id === this.selectedContactId) || null;
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    selectContact(contactId) {
      this.selectedContactId = contactId;
      this.messages = [];
      this.fetchMessages();
    },
    async sendMessage() {
      if ((this.newMessage.trim() || this.file || this.fileName) && this.selectedContactId) {
        let fileUrl = this.fileName;

        if (this.file) {
          const formData = new FormData();
          formData.append('image', this.file);

          try {
            const response = await fetch('http://localhost:5000/upload', {
              method: 'POST',
              body: formData
            });

            const result = await response.json();
            fileUrl = result.fileName;
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }

        const message = {
          sender_id: this.currentUser.id,
          receiver_id: this.selectedContactId,
          message_text: this.newMessage.trim() ? this.newMessage : null,
          file_name: fileUrl,
        };
        this.socket.emit('chat message', message);
        this.newMessage = '';
        this.file = null;
        this.imageUrl = null;
        this.fileName = null;
      }
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.file = file;
        this.fileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageUrl = e.target.result;
          this.isModalVisible = true;
        };
        reader.readAsDataURL(file);
      }
    },
    closeModal() {
      this.isModalVisible = false;
      this.imageUrl = null;
      this.fileName = null;
    },
    openFileDialog() {
      this.$refs.fileInput.click();
    },
    formatTime(dateTime) {
      const date = new Date(dateTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
}

};
</script>

<style scoped>
.list-group-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}


.list-group-item.active {
  background-color: #007bff;
  color: white;
}


.message-content {
  max-width: 15rem; /* Batasi lebar konten pesan */
  word-wrap: break-word; /* Membungkus teks panjang */
  overflow-wrap: break-word; /* Alternatif untuk membungkus teks */
}


.chat-container {
  height: 700px;
}

.chat-header {
  border-bottom: 1px solid #ddd;
}

.chat-messages {
  height: calc(100% - 78px);
  overflow-y: auto;
}

.chat-input {
  border-top: 1px solid #ddd;
}

.modal-dialog {
  max-width: 40rem;
  position: fixed;
  bottom: 3rem;
  right: 1rem;
}

.modal-body {
  text-align: center;
}
</style>
