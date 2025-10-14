<?php

use App\Models\OptionsModel;

if (!function_exists('get_suggestion_list')) {
    /**
     * Lấy danh sách gợi ý theo key từ file JSON writable/options/lists.json
     * Fallback: lấy từ bảng options (value là JSON array) hoặc mảng mặc định truyền vào.
     * Trả về mảng chuỗi đã trim và loại trùng.
     */
    function get_suggestion_list(string $key, array $fallback = []): array
    {
        static $cache = null;
        // Load file JSON một lần
        if ($cache === null) {
            $cache = [];
            try {
                // Prefer public/lists.json (accessible and versioned). FCPATH points to public/ (front controller path).
                if (defined('FCPATH')) {
                    $publicPath = rtrim(FCPATH, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'lists.json';
                    if (is_file($publicPath)) {
                        $json = @file_get_contents($publicPath);
                        if ($json !== false) {
                            $data = json_decode($json, true);
                            if (is_array($data)) {
                                $cache = $data;
                            }
                        }
                    }
                }

                // Fallback: writable area (existing behavior)
                if (empty($cache)) {
                    $path = rtrim(WRITEPATH, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'options' . DIRECTORY_SEPARATOR . 'lists.json';
                    if (is_file($path)) {
                        $json = @file_get_contents($path);
                        if ($json !== false) {
                            $data = json_decode($json, true);
                            if (is_array($data)) {
                                $cache = $data;
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                // ignore file errors
            }
        }

        // Ưu tiên lấy từ file
        $list = [];
        if (isset($cache[$key]) && is_array($cache[$key])) {
            $list = $cache[$key];
        } else {
            // Fallback: bảng options (value lưu JSON)
            try {
                $model = new OptionsModel();
                $row = $model->where('key', $key)->first();
                if ($row && isset($row['value'])) {
                    $arr = json_decode((string)$row['value'], true);
                    if (is_array($arr)) $list = $arr;
                }
            } catch (\Throwable $e) {
                // ignore options errors
            }
        }

        if (empty($list)) $list = $fallback;

        // Chuẩn hoá
        $out = [];
        foreach ((array)$list as $v) {
            if (!is_string($v)) continue;
            $s = trim($v);
            if ($s !== '' && !in_array($s, $out, true)) $out[] = $s;
        }
        return $out;
    }
}
