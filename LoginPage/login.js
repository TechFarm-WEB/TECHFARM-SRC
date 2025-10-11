// ------------------------------------------------------------------------------------------------
// AUTHOR : Sakshi Sahu
// CREATION DATE : 11.10.2025
// APPLICATION AREA : FRONT END UI
// OBJECT ID : GITHUB ISSUE NO. #16
// DESCRIPTION : Basic JS validation & button interactions for Login Page
// ------------------------------------------------------------------------------------------------

// START OF ISSUE: Create Login Page | 11.10.2025

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim();

    if (name === "" || mobile === "" || email === "") {
        alert("Please fill out all fields.");
        return;
    }

    // Basic pattern validation (just for demo purpose)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    alert(`Welcome ${name}! You’ve successfully logged in.`);
    // Here, backend integration or redirection can be added later
});

document.getElementById("signupBtn").addEventListener("click", function () {
    window.location.href = "signup.html";
});

// END OF ISSUE
