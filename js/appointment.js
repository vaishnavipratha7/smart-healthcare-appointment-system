document.addEventListener("DOMContentLoaded", function () {
  const hospitalSelect = document.getElementById("hospital");
  const doctorSelect = document.getElementById("doctor");
  const timeSlotSelect = document.getElementById("timeSlot");
  const appointmentForm = document.getElementById("appointmentForm");
  const confirmationBox = document.getElementById("confirmation");
  const appointmentList = document.getElementById("appointmentList");

  const doctors = {
      "Apollo": ["Dr. Mehta - Cardiology", "Dr. Roy - Orthopedics", "Dr. Sharma - General Medicine"],
      "Fortis": ["Dr. Kapoor - Neurology", "Dr. Jain - Pediatrics"],
      "Yashodha": ["Dr. Gupta - ENT", "Dr. Reddy - Dermatology"],
      "NIMS": ["Dr. Varma - Gastroenterology", "Dr. Das - Oncology"],
      "Rainbow": ["Dr. Rao - Gynecology", "Dr. Iyer - Pediatrics"]
  };

  const timeSlots = {
      "Dr. Mehta - Cardiology": ["10:00 AM", "12:00 PM", "3:00 PM"],
      "Dr. Roy - Orthopedics": ["9:30 AM", "11:00 AM", "4:30 PM"],
      "Dr. Sharma - General Medicine": ["10:15 AM", "2:00 PM", "5:30 PM"],
      "Dr. Kapoor - Neurology": ["9:00 AM", "1:30 PM"],
      "Dr. Jain - Pediatrics": ["11:45 AM", "3:15 PM"],
      "Dr. Gupta - ENT": ["10:30 AM", "2:45 PM"],
      "Dr. Reddy - Dermatology": ["8:30 AM", "12:15 PM"],
      "Dr. Varma - Gastroenterology": ["9:45 AM", "1:00 PM"],
      "Dr. Das - Oncology": ["10:30 AM", "4:15 PM"],
      "Dr. Rao - Gynecology": ["9:15 AM", "3:45 PM"],
      "Dr. Iyer - Pediatrics": ["10:45 AM", "1:15 PM"]
  };

  hospitalSelect.innerHTML = '<option value="" selected disabled>Select Hospital</option>';
  Object.keys(doctors).forEach(hospital => {
      const option = document.createElement("option");
      option.value = hospital;
      option.textContent = hospital;
      hospitalSelect.appendChild(option);
  });

  async function loadAppointments() {
      appointmentList.innerHTML = "";
      try {
          const res = await fetch("/api/appointments");
          const appointments = await res.json();
          if (!appointments.length) {
              appointmentList.innerHTML = "<p>No appointments booked yet.</p>";
          } else {
              appointments.forEach(appt => {
                  const div = document.createElement("div");
                  div.classList.add("appointment-item");
                  div.innerHTML = `
                      <p><strong>${appt.name}</strong> - ${appt.hospital} - ${appt.doctor}</p>
                      <p>${appt.date} at ${appt.timeSlot}</p>
                      <button class="cancel-btn" data-id="${appt._id}">Cancel</button>
                  `;
                  appointmentList.appendChild(div);
              });
          }
      } catch (err) {
          appointmentList.innerHTML = "<p>Failed to load appointments.</p>";
          console.error(err);
      }
  }

  hospitalSelect.addEventListener("change", function () {
      const selectedHospital = this.value;
      doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
      timeSlotSelect.innerHTML = '<option value="">Select Time Slot</option>';
      doctorSelect.disabled = true;
      timeSlotSelect.disabled = true;
      if (selectedHospital && doctors[selectedHospital]) {
          doctorSelect.disabled = false;
          doctors[selectedHospital].forEach(doc => {
              const option = document.createElement("option");
              option.value = doc;
              option.textContent = doc;
              doctorSelect.appendChild(option);
          });
      }
  });

  doctorSelect.addEventListener("change", function () {
      const selectedDoctor = this.value;
      timeSlotSelect.innerHTML = '<option value="">Select Time Slot</option>';
      timeSlotSelect.disabled = true;
      if (selectedDoctor && timeSlots[selectedDoctor]) {
          timeSlotSelect.disabled = false;
          timeSlots[selectedDoctor].forEach(slot => {
              const option = document.createElement("option");
              option.value = slot;
              option.textContent = slot;
              timeSlotSelect.appendChild(option);
          });
      }
  });

  appointmentForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const hospital = hospitalSelect.value;
    const doctor = doctorSelect.value;
    const timeSlot = timeSlotSelect.value;
    const date = document.getElementById("date").value;
    const reason = document.getElementById("reason").value.trim();

    if (!hospital || !doctor || !timeSlot) {
        alert("Please select a hospital, doctor, and time slot.");
        return;
    }

    const availabilityRes = await fetch(`/api/appointments/checkAvailability?doctor=${encodeURIComponent(doctor)}&date=${encodeURIComponent(date)}&timeSlot=${encodeURIComponent(timeSlot)}`);
    const availability = await availabilityRes.json();
    if (!availability.available) {
        alert("This time slot is not available. Please choose another.");
        return;
    }

    const newAppointment = { userId: 'tempUserId', name, phone, email, hospital, doctor, timeSlot, date, reason }; // Temp userId
    try {
        const res = await fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAppointment)
        });
        if (!res.ok) throw new Error("Failed to book appointment.");
        const saved = await res.json();
        const formattedDate = new Date(saved.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        confirmationBox.innerHTML = `
            <h3>Appointment Confirmed!</h3>
            <p><strong>Name:</strong> ${saved.name}</p>
            <p><strong>Phone:</strong> ${saved.phone}</p>
            <p><strong>Email:</strong> ${saved.email}</p>
            <p><strong>Hospital:</strong> ${saved.hospital}</p>
            <p><strong>Doctor:</strong> ${saved.doctor}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time Slot:</strong> ${saved.timeSlot}</p>
            <p><strong>Reason:</strong> ${saved.reason}</p>
            <p><strong>Queue Delay:</strong> 5 minutes</p>
        `;
        confirmationBox.style.display = "block";
        appointmentForm.reset();
        doctorSelect.disabled = true;
        timeSlotSelect.disabled = true;
        loadAppointments();
        document.getElementById("bookAnotherBtn").style.display = "block";
    } catch (err) {
        alert("Error saving appointment.");
        console.error(err);
    }
});

  appointmentList.addEventListener("click", async function (e) {
      if (e.target.classList.contains("cancel-btn")) {
          const id = e.target.dataset.id;
          try {
              await fetch(`/api/appointments/${id}`, { method: "DELETE" });
              loadAppointments();
          } catch (err) {
              console.error("Failed to cancel appointment:", err);
          }
      }
  });

  loadAppointments();
});