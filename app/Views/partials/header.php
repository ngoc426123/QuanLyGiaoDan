<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title><?= esc(($page_title ?? 'Hệ thống Quản lý Giáo dân') . ' - ' . church_name('Giáo xứ')) ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Hệ thống quản lý giáo dân <?= esc(church_name('Giáo xứ')) ?> - Quản lý thông tin giáo dân, gia đình và giáo khu hiệu quả">
    <meta name="keywords" content="quản lý giáo dân, giáo xứ, <?= esc(church_name('giáo xứ')) ?>, catholic, parish management">
    <meta name="author" content="Hoàng Minh Ngọc">
    
    <!-- Favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="<?= base_url('images/favicons/apple-touch-icon.png') ?>">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= base_url('images/favicons/favicon-32x32.png') ?>">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= base_url('images/favicons/favicon-16x16.png') ?>">
    <link rel="manifest" href="<?= base_url('images/favicons/site.webmanifest') ?>">
    <link rel="shortcut icon" href="<?= base_url('images/favicons/favicon.ico') ?>">
    <meta name="msapplication-TileColor" content="#2b5797">
    <meta name="theme-color" content="#ffffff">
    
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="<?= base_url('css/bootstrap.min.css') ?>">
    <!-- Vanilla JS Datepicker (Bootstrap 5 theme) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/css/datepicker-bs5.min.css">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?= base_url('css/style.css') ?>">
    <!-- Themes -->
    <link rel="stylesheet" href="<?= base_url('css/vista.css') ?>">
    <!-- Optional Material theme (activate by using <body class="material-theme">) -->
    <link rel="stylesheet" href="<?= base_url('css/material.css') ?>">
    <script>window.BASE_URL = <?= json_encode(rtrim(base_url('/'), '/').'/') ?>;</script>
</head>
<body class="vista-theme">