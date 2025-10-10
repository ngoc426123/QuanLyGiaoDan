    <!-- Bootstrap JS -->
    <script src="<?= base_url('js/bootstrap.bundle.min.js') ?>"></script>
    <script>
        // JS chuyển tab ribbon
        document.querySelectorAll('.office-ribbon-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.office-ribbon-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.getAttribute('data-tab');
                document.querySelectorAll('.office-ribbon-group').forEach(g => {
                    g.style.display = g.getAttribute('data-group') === tabName ? 'block' : 'none';
                });
            });
        });
    </script>
</body>
</html>