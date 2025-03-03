        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('.clickable-img');
            const modalImage = document.getElementById('modalImage');

            images.forEach(image => {
                image.addEventListener('click', () => {
                    modalImage.src = image.src;
                });
            });
        });
