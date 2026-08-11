<?php
declare(strict_types=1);

/**
 * api/fetch_matches.php
 *
 * Server-side proxy for the free, public-domain openfootball "worldcup.json"
 * feed (https://github.com/openfootball/worldcup.json — CC0, no API key,
 * no rate limit). We fetch it here instead of directly from the browser so:
 *   1. There's a single place to swap data sources later.
 *   2. We can cache the response to a local file and avoid hammering GitHub.
 *   3. We can enrich each match with an ISO country code so the frontend
 *      can pull flag images from flagcdn.com without another API.
 *
 * NOTE: the 2026 World Cup itself (11 Jun – 19 Jul 2026) has already been
 * played, so this feed now serves final results rather than live data.
 * Swap SOURCE_URL for any live-score API's endpoint later without touching
 * app.js — it only talks to this file.
 */

header('Content-Type: application/json');

const SOURCE_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const CACHE_FILE = __DIR__ . '/_cache_worldcup2026.json';
const CACHE_TTL  = 300; // seconds

// Common country name -> ISO 3166-1 alpha-2 code, for flagcdn.com icons.
const COUNTRY_CODES = [
    'Mexico' => 'mx', 'South Africa' => 'za', 'South Korea' => 'kr', 'Czech Republic' => 'cz',
    'Argentina' => 'ar', 'Austria' => 'at', 'France' => 'fr', 'England' => 'gb-eng',
    'Spain' => 'es', 'Brazil' => 'br', 'Germany' => 'de', 'Portugal' => 'pt',
    'Netherlands' => 'nl', 'Belgium' => 'be', 'Croatia' => 'hr', 'Italy' => 'it',
    'USA' => 'us', 'United States' => 'us', 'Canada' => 'ca', 'Japan' => 'jp',
    'Morocco' => 'ma', 'Senegal' => 'sn', 'Uruguay' => 'uy', 'Colombia' => 'co',
    'Switzerland' => 'ch', 'Denmark' => 'dk', 'Poland' => 'pl', 'Serbia' => 'rs',
    'Ecuador' => 'ec', 'Ghana' => 'gh', 'Cameroon' => 'cm', 'Tunisia' => 'tn',
    'Australia' => 'au', 'Iran' => 'ir', 'Saudi Arabia' => 'sa', 'Qatar' => 'qa',
    'Wales' => 'gb-wls', 'Costa Rica' => 'cr', 'Peru' => 'pe', 'Chile' => 'cl',
    'Nigeria' => 'ng', 'Egypt' => 'eg', 'Algeria' => 'dz', 'Ivory Coast' => 'ci',
    'Sweden' => 'se', 'Norway' => 'no', 'Turkey' => 'tr', 'Scotland' => 'gb-sct',
    'Paraguay' => 'py', 'Venezuela' => 've', 'Panama' => 'pa', 'Jamaica' => 'jm',
    'New Zealand' => 'nz', 'Jordan' => 'jo', 'Uzbekistan' => 'uz',
    'Curacao' => 'cw', 'Haiti' => 'ht', 'Bolivia' => 'bo', 'Cape Verde' => 'cv',
];

function fetch_source(): ?string {
    if (is_readable(CACHE_FILE) && (time() - filemtime(CACHE_FILE) < CACHE_TTL)) {
        return file_get_contents(CACHE_FILE);
    }

    $ch = curl_init(SOURCE_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_USERAGENT      => 'SOCCEE-App/1.0',
    ]);
    $body = curl_exec($ch);
    $ok = $body !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
    curl_close($ch);

    if ($ok) {
        file_put_contents(CACHE_FILE, $body);
        return $body;
    }

    // Fall back to a stale cache rather than failing outright, if we have one.
    return is_readable(CACHE_FILE) ? file_get_contents(CACHE_FILE) : null;
}

$raw = fetch_source();
if ($raw === null) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach the match data source.']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data) || !isset($data['matches'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Unexpected data format from source.']);
    exit;
}

$matches = array_map(function ($m) {
    $m['team1_code'] = COUNTRY_CODES[$m['team1']] ?? null;
    $m['team2_code'] = COUNTRY_CODES[$m['team2']] ?? null;
    // 'stats' and 'lineups' aren't part of the free feed — left unset so
    // the frontend shows its "not available" state instead of fake data.
    return $m;
}, $data['matches']);

echo json_encode(['name' => $data['name'] ?? 'World Cup 2026', 'matches' => $matches]);
