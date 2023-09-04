document.addEventListener('DOMContentLoaded', function () {
    const listItems = document.querySelectorAll('.hover-list li');

    listItems.forEach(function (item) {
        item.addEventListener('click', function () {
            // Remover la clase 'selected' de todos los elementos
            listItems.forEach(el => el.classList.remove('selected'));

            // Agregar la clase 'selected' al elemento clickeado
            item.classList.add('selected');
        });
    });
});