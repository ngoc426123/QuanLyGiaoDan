<?php

use App\Models\OptionsModel;

if (!function_exists('get_option')) {
    function get_option(string $key, $default = null)
    {
        static $cache = null;
        if ($cache === null) {
            $cache = [];
            try {
                $model = new OptionsModel();
                foreach ($model->select('`key`, `value`')->findAll() as $row) {
                    $cache[$row['key']] = $row['value'];
                }
            } catch (Throwable $e) {
                // ignore; return defaults
            }
        }
        return array_key_exists($key, $cache) ? $cache[$key] : $default;
    }
}

if (!function_exists('church_name')) {
    function church_name(string $default = 'Giáo xứ')
    {
        return (string) get_option('church_name', $default);
    }
}

if (!function_exists('church_address')) {
    function church_address(string $default = '')
    {
        return (string) get_option('church_address', $default);
    }
}

if (!function_exists('date_format_option')) {
    function date_format_option(string $default = 'dd/mm/yyyy')
    {
        return (string) get_option('date_format', $default);
    }
}
