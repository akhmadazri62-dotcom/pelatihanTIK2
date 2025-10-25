// Data antrian disimpan di localStorage
class QueueManager {
    constructor() {
        this.queueData = this.loadQueueData();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    // Inisialisasi aplikasi
    init() {
        this.setupEventListeners();
        this.renderQueueList();
        this.renderCurrentQueue();
        this.updateYear();
    }

    // Setup event listeners
    setupEventListeners() {
        // Form pendaftaran
        document.getElementById('registrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerPatient();
        });

        // Tombol panggil antrian berikutnya
        document.getElementById('nextQueueBtn').addEventListener('click', () => {
            this.callNextQueue();
        });

        // Tombol reset antrian
        document.getElementById('resetQueueBtn').addEventListener('click', () => {
            this.resetQueue();
        });
    }

    // Load data dari localStorage
    loadQueueData() {
        const savedData = localStorage.getItem('dentalQueue');
        if (savedData) {
            return JSON.parse(savedData);
        } else {
            // Data contoh jika tidak ada data tersimpan
            return [
                { id: 1, nomor: 'A-01', nama: 'Rina', dokter: 'drg. Sari Indah', keluhan: 'Sakit gigi', waktu: this.getCurrentTime(), status: 'in-progress' },
                { id: 2, nomor: 'A-02', nama: 'Budi', dokter: 'drg. Sari Indah', keluhan: 'Pembersihan karang gigi', waktu: this.getCurrentTime(), status: 'waiting' },
                { id: 3, nomor: 'A-03', nama: 'Sari', dokter: 'drg. Budi Santoso', keluhan: 'Tambal gigi', waktu: this.getCurrentTime(), status: 'waiting' }
            ];
        }
    }

    // Simpan data ke localStorage
    saveQueueData() {
        localStorage.setItem('dentalQueue', JSON.stringify(this.queueData));
    }

    // Daftar pasien baru
    registerPatient() {
        const nama = document.getElementById('nama').value.trim();
        const telepon = document.getElementById('telepon').value.trim();
        const keluhan = document.getElementById('keluhan').value;
        const dokter = document.getElementById('dokter').value;

        // Validasi
        if (!nama || !telepon || !keluhan || !dokter) {
            this.showNotification('Harap isi semua field!', 'error');
            return;
        }

        // Buat entri antrian baru
        const newQueue = {
            id: Date.now(), // ID unik berdasarkan timestamp
            nomor: this.generateNextQueueNumber(),
            nama: nama,
            telepon: telepon,
            dokter: dokter,
            keluhan: keluhan,
            waktu: this.getCurrentTime(),
            status: 'waiting'
        };

        // Tambahkan ke data antrian
        this.queueData.push(newQueue);
        
        // Simpan dan perbarui tampilan
        this.saveQueueData();
        this.renderQueueList();
        
        // Reset form
        document.getElementById('registrationForm').reset();
        
        // Tampilkan konfirmasi
        this.showNotification(`Pendaftaran berhasil! Nomor antrian Anda: ${newQueue.nomor}`, 'success');
    }

    // Panggil antrian berikutnya
    callNextQueue() {
        const waitingQueue = this.queueData.filter(item => item.status === 'waiting');
        
        if (waitingQueue.length === 0) {
            this.showNotification('Tidak ada antrian yang menunggu', 'info');
            return;
        }

        // Ubah status antrian saat ini menjadi selesai (jika ada)
        const currentInProgress = this.queueData.find(item => item.status === 'in-progress');
        if (currentInProgress) {
            currentInProgress.status = 'completed';
        }

        // Panggil antrian berikutnya
        const nextQueue = waitingQueue[0];
        nextQueue.status = 'in-progress';

        // Simpan dan perbarui tampilan
        this.saveQueueData();
        this.renderQueueList();
        this.renderCurrentQueue();
        
        this.showNotification(`Memanggil: ${nextQueue.nomor} - ${nextQueue.nama}`, 'info');
        
        // Simulasi panggilan suara (bisa diintegrasikan dengan Web Speech API)
        this.simulateVoiceCall(nextQueue);
    }

    // Reset antrian hari ini
    resetQueue() {
        if (confirm('Apakah Anda yakin ingin mereset semua antrian hari ini?')) {
            this.queueData = [];
            this.saveQueueData();
            this.renderQueueList();
            this.renderCurrentQueue();
            this.showNotification('Antrian telah direset', 'success');
        }
    }

    // Tampilkan daftar antrian
    renderQueueList() {
        const queueList = document.getElementById('queueList');
        queueList.innerHTML = '';
        
        if (this.queueData.length === 0) {
            queueList.innerHTML = '<p class="no-queue">Tidak ada antrian</p>';
            return;
        }
        
        this.queueData.forEach(item => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item fade-in';
            
            let statusText = '';
            let statusClass = '';
            
            switch(item.status) {
                case 'waiting':
                    statusText = 'Menunggu';
                    statusClass = 'status-waiting';
                    break;
                case 'in-progress':
                    statusText = 'Sedang Diperiksa';
                    statusClass = 'status-in-progress';
                    break;
                case 'completed':
                    statusText = 'Selesai';
                    statusClass = 'status-completed';
                    break;
            }
            
            queueItem.innerHTML = `
                <div class="queue-info">
                    <span class="queue-number-small">${item.nomor}</span>
                    <span class="queue-name">${item.nama}</span>
                    <span class="queue-time">${item.waktu} - ${item.dokter}</span>
                </div>
                <div class="queue-status ${statusClass}">${statusText}</div>
            `;
            
            queueList.appendChild(queueItem);
        });
    }

    // Tampilkan antrian saat ini
    renderCurrentQueue() {
        const currentQueue = this.queueData.find(item => item.status === 'in-progress');
        
        if (currentQueue) {
            document.getElementById('currentQueue').textContent = currentQueue.nomor;
            document.getElementById('currentPatient').textContent = `${currentQueue.dokter} - ${currentQueue.nama}`;
        } else {
            document.getElementById('currentQueue').textContent = '-';
            document.getElementById('currentPatient').textContent = 'Tidak ada antrian';
        }
    }

    // Generate nomor antrian berikutnya
    generateNextQueueNumber() {
        if (this.queueData.length === 0) {
            return 'A-01';
        }
        
        // Cari nomor terakhir
        const lastQueue = this.queueData
            .filter(item => item.nomor.startsWith('A-'))
            .sort((a, b) => {
                const numA = parseInt(a.nomor.split('-')[1]);
                const numB = parseInt(b.nomor.split('-')[1]);
                return numB - numA;
            })[0];
        
        if (!lastQueue) {
            return 'A-01';
        }
        
        const lastNumber = parseInt(lastQueue.nomor.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `A-${nextNumber.toString().padStart(2, '0')}`;
    }

    // Dapatkan waktu saat ini
    getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    // Update tahun di footer
    updateYear() {
        document.getElementById('currentYear').textContent = this.currentYear;
    }

    // Tampilkan notifikasi
    showNotification(message, type = 'info') {
        // Hapus notifikasi sebelumnya
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Buat notifikasi baru
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Tampilkan notifikasi
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Sembunyikan setelah 3 detik
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Simulasi panggilan suara (bisa dikembangkan dengan Web Speech API)
    simulateVoiceCall(queue) {
        // Di sini bisa diintegrasikan dengan Web Speech API untuk panggilan suara
        console.log(`Memanggil: Nomor antrian ${queue.nomor}, ${queue.nama}, silakan menuju ruang periksa`);
        
        // Contoh sederhana menggunakan Speech Synthesis API
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance();
            speech.text = `Nomor antrian ${queue.nomor}, ${queue.nama}, silakan menuju ruang periksa`;
            speech.lang = 'id-ID';
            speech.rate = 0.9;
            window.speechSynthesis.speak(speech);
        }
    }
}

// Inisialisasi aplikasi ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new QueueManager();
});
