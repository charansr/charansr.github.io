// Typing effect for hero section
const heroText = document.querySelector('#hero h1');
const text = "BASIS Independent Silicon Valley<br>Hackathon 2025"; // Keep the line break

let index = 0;

function typeEffect() {
    if (text.charAt(index) === "<") {
        // If we encounter an HTML tag, insert the whole tag
        let htmlTag = "";
        while (text.charAt(index) !== ">") {
            htmlTag += text.charAt(index);
            index++;
        }
        htmlTag += text.charAt(index); // Add the closing ">"
        heroText.innerHTML += htmlTag;
        index++; // Move past ">"
    } else {
        // Append normal characters one by one
        heroText.innerHTML += text.charAt(index);
        index++;
    }

    if (index < text.length) {
        setTimeout(typeEffect, 50); // Adjust typing speed here
    }
}

window.onload = typeEffect;

// JavaScript to toggle FAQ answers and arrow direction
document.querySelectorAll('.faq-item h3').forEach(item => {
    item.addEventListener('click', () => {
        const answer = item.nextElementSibling;

        // Toggle the 'active' class on both the question and the answer
        answer.classList.toggle('active');
        item.classList.toggle('active');

        // Smooth toggle effect for the answer
        if (answer.style.maxHeight) {
            answer.style.maxHeight = null;
        } else {
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
});
