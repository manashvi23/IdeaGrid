// public/javascripts/script.js
document.addEventListener('DOMContentLoaded', () => {
  const downloadButtons = document.querySelectorAll('.download-tracker-btn');

  if (downloadButtons.length === 0) {
    console.warn('⚠️ No download-tracker-btn elements found on page.');
    return;
  }

  downloadButtons.forEach(button => {
    const postId = button.dataset.postId;
    if (!postId) {
      console.warn('⚠️ Missing data-post-id on button:', button);
      return; // Skip this button and move to the next
    }

    button.addEventListener('click', async (e) => {
      e.preventDefault(); // Prevent default link behavior if it's an <a> tag
      try {
        const response = await fetch(`/posts/${postId}/record-download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Download recorded:', data.message);
        } else {
          console.error('❌ Failed to record download:', response.statusText);
        }
      } catch (error) {
        console.error('🚨 Error tracking download:', error);
      }
    });
  });
});















// // public/javascripts/script.js

// document.addEventListener('DOMContentLoaded', () => {
//   // 📌 Check if buttons exist before trying to bind
//   const downloadButtons = document.querySelectorAll('.download-tracker-btn');

//   if (downloadButtons.length === 0) {
//     console.warn('⚠️ No download-tracker-btn elements found on page.');
//   }

//   downloadButtons.forEach(button => {
//     button.addEventListener('click', async () => {
//       const postId = button.dataset.postId;
//       if (!postId) {
//         console.warn('⚠️ Missing data-post-id on button');
//         return;
//       }

//       try {
//         const response = await fetch(`/posts/${postId}/record-download`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           console.log('✅ Download recorded:', data.message);
//         } else {
//           console.error('❌ Failed to record download:', response.statusText);
//         }
//       } catch (error) {
//         console.error('🚨 Error tracking download:', error);
//       }
//     });
//   });
// });
