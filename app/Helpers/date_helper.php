<?php

if (! function_exists('format_date')) {
    /**
     * Format a date string (Y-m-d or Y-m-d H:i:s) according to the
     * application option `date_format` (stored in options table).
     *
     * If the provided value is a DateTime instance, it will be used directly.
     * If it's a timestamp or string, an attempt to parse it is made.
     * Returns null when input is empty or cannot be parsed.
     */
    function format_date($value): ?string
    {
        if ($value instanceof \DateTime) {
            $dt = $value;
        } elseif (is_numeric($value)) {
            try {
                $dt = (new \DateTime())->setTimestamp((int)$value);
            } catch (Throwable $e) {
                return null;
            }
        } else {
            $v = trim((string) $value);
            if ($v === '' || in_array($v, ['0000-00-00','0'], true)) {
                return null;
            }
            try {
                $dt = new \DateTime($v);
            } catch (Throwable $e) {
                return null;
            }
        }

        $opt = function_exists('date_format_option') ? date_format_option() : 'dd/mm/yyyy';
            // Convert common user-friendly tokens (dd, mm, yyyy, etc.) into PHP date() format
            $toPhp = function(string $optStr) {
                $s = trim((string)$optStr);
                if ($s === '') return 'd/m/Y';
                $s = mb_strtolower($s);
                // normalize separators (keep them), but allow ., / or -
                // Replace tokens in order of length to avoid partial replacements
                $replacements = [
                    'yyyy' => 'Y',
                    'yy'   => 'y',
                    'dd'   => 'd',
                    'd'    => 'd',
                    'mm'   => 'm',
                    'm'    => 'm',
                    'y'    => 'Y',
                ];
                // Use a simple token replacement preserving separators
                // We'll iterate over the string replacing tokens we recognize
                $result = '';
                $i = 0; $len = mb_strlen($s);
                while ($i < $len) {
                    $matched = false;
                    // try to match longest tokens first
                    foreach (['yyyy','yy','dd','mm','d','m','y'] as $t) {
                        $tlen = mb_strlen($t);
                        if (mb_substr($s, $i, $tlen) === $t) {
                            $result .= $replacements[$t];
                            $i += $tlen;
                            $matched = true;
                            break;
                        }
                    }
                    if ($matched) continue;
                    // otherwise copy separator or unknown char
                    $result .= mb_substr($s, $i, 1);
                    $i++;
                }
                return $result ?: 'd/m/Y';
            };

            $fmt = $toPhp($opt);
            return $dt->format($fmt);
    }
}

if (! function_exists('format_datetime')) {
    /**
     * Format a date/time string using the app date_format option plus time.
     * Example: date_format dd/mm/yyyy -> "d/m/Y H:i".
     */
    function format_datetime($value): ?string
    {
        if ($value instanceof \DateTime) {
            $dt = $value;
        } elseif (is_numeric($value)) {
            try {
                $dt = (new \DateTime())->setTimestamp((int)$value);
            } catch (Throwable $e) {
                return null;
            }
        } else {
            $v = trim((string) $value);
            if ($v === '' || in_array($v, ['0000-00-00','0000-00-00 00:00:00','0'], true)) {
                return null;
            }
            try {
                $dt = new \DateTime($v);
            } catch (Throwable $e) {
                return null;
            }
        }

        $opt = function_exists('date_format_option') ? date_format_option() : 'dd/mm/yyyy';
        // Reuse same mapping and append time
        $toPhp = function(string $optStr) {
            $s = trim((string)$optStr);
            if ($s === '') return 'd/m/Y';
            $s = mb_strtolower($s);
            $replacements = [
                'yyyy' => 'Y',
                'yy'   => 'y',
                'dd'   => 'd',
                'd'    => 'd',
                'mm'   => 'm',
                'm'    => 'm',
                'y'    => 'Y',
            ];
            $result = '';
            $i = 0; $len = mb_strlen($s);
            while ($i < $len) {
                $matched = false;
                foreach (['yyyy','yy','dd','mm','d','m','y'] as $t) {
                    $tlen = mb_strlen($t);
                    if (mb_substr($s, $i, $tlen) === $t) {
                        $result .= $replacements[$t];
                        $i += $tlen;
                        $matched = true;
                        break;
                    }
                }
                if ($matched) continue;
                $result .= mb_substr($s, $i, 1);
                $i++;
            }
            return $result ?: 'd/m/Y';
        };

        $fmt = $toPhp($opt) . ' H:i';
        return $dt->format($fmt);
    }
}
