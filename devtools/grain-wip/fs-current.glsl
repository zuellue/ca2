#version 300 es
precision highp float; precision highp int;
in vec2 uv; out vec4 outc;
uniform sampler2D HOOKED; uniform sampler2D TEX_BLUENOISE; uniform vec2 HOOKED_size;
uniform float BASE_STRENGTH, GR_AMOUNT, GRAIN_SIZE, GRAIN_SOFTNESS, CHROMA_SPLIT, DEVELOPMENT, FINE_WEIGHT, CRYSTAL_WEIGHT, CLOUD_WEIGHT, GR_ANIM_BUCKET, OVERLAY;
const float FINE_SIZE_RATIO = 0.5, CLOUD_SIZE_RATIO = 2.2, GR_SHADOW_SENSITIVITY = 1.8, GR_MIDTONE_SENSITIVITY = 1.5, GR_HIGHLIGHT_SENSITIVITY = 2.7;
const float GR_FRAME_PEAK = 0.5, GR_NOISE_LEVEL = 0.10, GR_MOTION_LEVEL = 0.20;
vec4 HOOKED_tex(vec2 q){ return texture(HOOKED, q); }
float TEX_BLUENOISE_r(vec2 q){ return texture(TEX_BLUENOISE, q).r; }

float mod289(float x) { return x - floor(x / 289.0) * 289.0; }
float permute(float x) { float xr = mod289(x); return mod289((34.0 * xr + 1.0) * xr); }
float rand01(float x) { return fract(x / 41.0); }




vec2 dihedral_transform(vec2 p, int sel) {
    if (sel >= 4) { p.x = mod(64.0 - p.x, 64.0); sel -= 4; }
    if (sel == 1) return vec2(p.y, mod(64.0 - p.x, 64.0));
    if (sel == 2) return vec2(mod(64.0 - p.x, 64.0), mod(64.0 - p.y, 64.0));
    if (sel == 3) return vec2(mod(64.0 - p.y, 64.0), p.x);
    return p;
}

float sample_bluenoise(vec2 pos_px, float cell_size, float salt, float frame_bucket, float time_seed) {
    vec2 cell_pos = pos_px / max(cell_size, 0.01);
    vec2 tile_id = floor(cell_pos / 64.0);
    vec2 local_p = mod(cell_pos, 64.0);

    
    float h = permute(tile_id.x * 41.0 + tile_id.y * 113.0 + salt * 7.0 + frame_bucket * time_seed);
    int sel = int(floor(rand01(h) * 8.0));
    float oh = permute(h + 5.0);
    float ox = floor(rand01(oh) * 64.0);
    float oy = floor(rand01(permute(oh + 1.0)) * 64.0);
    vec2 lp = mod(local_p + vec2(ox, oy), 64.0);
    vec2 tp = dihedral_transform(lp, sel);

    
    vec2 d = vec2(0.5 / 64.0, 0.0);
    float raw = (TEX_BLUENOISE_r((tp + 0.5) / 64.0 + d.xx)
              + TEX_BLUENOISE_r((tp + 0.5) / 64.0 + d.yy)
              + TEX_BLUENOISE_r((tp + 0.5) / 64.0 - d.xx)
              + TEX_BLUENOISE_r((tp + 0.5) / 64.0 - d.yy)) * 0.25;
    float dither = raw * 2.0 - 1.0;

    
    vec2 cell_xy = floor(cell_pos);
    float amp_h = permute(cell_xy.x * 53.0 + cell_xy.y * 97.0 + salt * 13.0 + frame_bucket * time_seed);
    float amp = rand01(amp_h);
    return dither * amp;
}


float luma_adapt(float luma) {
    float deviation = (luma - 0.40) / 0.45;
    float midtone = exp(-deviation * deviation);
    float shadow_floor = 0.12 * (1.0 - smoothstep(0.0, 0.30, luma));
    float highlight_floor = 0.20 * smoothstep(0.5, 0.85, luma);
    return clamp(midtone + shadow_floor + highlight_floor, 0.0, 1.05);
}


float zone_sensitivity(float luma) {
    float shadow_w    = 1.0 - smoothstep(0.0, 0.15, luma);
    float highlight_w = smoothstep(0.95, 1.0, luma);
    float midtone_w   = clamp(1.0 - shadow_w - highlight_w, 0.0, 1.0);
    return shadow_w * GR_SHADOW_SENSITIVITY
         + midtone_w * GR_MIDTONE_SENSITIVITY
         + highlight_w * GR_HIGHLIGHT_SENSITIVITY;
}




float soft_grain_layer(vec2 pos_px, float cell_size, float softness,
                        float salt, float frame_bucket, float time_seed) {
    float hard = sample_bluenoise(pos_px, cell_size, salt, frame_bucket, time_seed);
    vec2 soft_offset = vec2(cell_size, cell_size) * 0.750;
    float soft = sample_bluenoise(pos_px + soft_offset, cell_size, salt, frame_bucket, time_seed);
    return mix(hard, soft, clamp(softness, 0.0, 1.0));
}

float grain_layers(vec2 pos_px, float eff_grain_size, float channel_seed, float frame_bucket) {
    float cell_fine    = eff_grain_size * FINE_SIZE_RATIO;
    float cell_crystal = eff_grain_size;
    float cell_cloud   = eff_grain_size * CLOUD_SIZE_RATIO;
    float salt_fine    = 3.0  + channel_seed;
    float salt_crystal = 11.0 + channel_seed;
    float salt_cloud   = 29.0 + channel_seed;
    float tseed_fine    = 3.30277563773  + channel_seed;
    float tseed_crystal = 19.61803398875 + channel_seed;
    float tseed_cloud   = 7.41421356237  + channel_seed;
    float fine    = soft_grain_layer(pos_px, cell_fine,    GRAIN_SOFTNESS, salt_fine,    frame_bucket, tseed_fine);
    float crystal = soft_grain_layer(pos_px, cell_crystal, GRAIN_SOFTNESS, salt_crystal, frame_bucket, tseed_crystal);
    float cloud   = soft_grain_layer(pos_px, cell_cloud,   GRAIN_SOFTNESS, salt_cloud,   frame_bucket, tseed_cloud);
    float w_fn = max(FINE_WEIGHT, 0.0);
    float w_cr = max(CRYSTAL_WEIGHT, 0.0);
    float w_cl = max(CLOUD_WEIGHT, 0.0);
    float wsum = max(w_fn + w_cr + w_cl, 0.001);
    float raw = (fine * w_fn + crystal * w_cr + cloud * w_cl) / wsum;
    return raw * DEVELOPMENT;
}


float local_texture_variance(float center_luma) {
    vec2 d = 1.0 / HOOKED_size;
    vec3 lw = vec3(0.299, 0.587, 0.114);
    float s = 0.0, s2 = 0.0, l;
    l = dot(HOOKED_tex(uv + vec2(-d.x, -d.y)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2( 0.0, -d.y)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2( d.x, -d.y)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2(-d.x,  0.0)).rgb, lw); s += l; s2 += l*l;
    l = center_luma; s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2( d.x,  0.0)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2(-d.x,  d.y)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2( 0.0,  d.y)).rgb, lw); s += l; s2 += l*l;
    l = dot(HOOKED_tex(uv + vec2( d.x,  d.y)).rgb, lw); s += l; s2 += l*l;
    s /= 9.0; s2 /= 9.0;
    return max(0.0, s2 - s * s);
}



void main() {
    vec4 color = HOOKED_tex(uv);
    float frame_bucket = GR_ANIM_BUCKET;
    float peak = GR_FRAME_PEAK, noise = GR_NOISE_LEVEL, motion = GR_MOTION_LEVEL;
    float eff_size = GRAIN_SIZE;
    vec2 pos_px = uv * HOOKED_size;
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float luma_gain = luma_adapt(luma) * zone_sensitivity(luma);
    float adapt = GR_AMOUNT;
    adapt *= 1.0 + 0.8 * (1.0 - peak);
    adapt *= 1.0 - smoothstep(0.05, 0.35, noise) * 0.5;
    adapt *= mix(0.80, 1.20, motion);
    float tex_var = local_texture_variance(luma);
    float tex_density = 1.0 - smoothstep(0.0, 0.008, tex_var) * 0.35;
    float amp = luma_gain * (BASE_STRENGTH / 10.0) * adapt * 0.85;
    amp *= tex_density;
    float g_r_raw = grain_layers(pos_px, eff_size, 0.0,  frame_bucket);
    float g_g_raw = grain_layers(pos_px, eff_size, 17.0, frame_bucket);
    float g_b_raw = grain_layers(pos_px, eff_size, 37.0, frame_bucket);
    float g_luma = g_r_raw * 0.299 + g_g_raw * 0.587 + g_b_raw * 0.114;
    vec3 sp = vec3(0.95, 0.92, 1.05);
    float g_r = mix(g_r_raw, g_luma, CHROMA_SPLIT);
    float g_g = mix(g_g_raw, g_luma, CHROMA_SPLIT);
    float g_b = mix(g_b_raw, g_luma, CHROMA_SPLIT);
    float chroma_blend = clamp(CHROMA_SPLIT * 4.0, 0.0, 1.0);
    g_r *= mix(1.0, sp.x, chroma_blend); g_g *= mix(1.0, sp.y, chroma_blend); g_b *= mix(1.0, sp.z, chroma_blend);
    vec3 gn = vec3(g_r, g_g, g_b) * amp;
    if (OVERLAY > 0.5) {
        float a = clamp(max(abs(gn.r), max(abs(gn.g), abs(gn.b))) * 3.0, 0.0, 1.0);
        vec3 col = clamp(vec3(0.5) + gn * 2.0, 0.0, 1.0);
        outc = vec4(col * a, a);
    } else {
        outc = vec4(clamp(color.rgb + gn, 0.0, 1.0), 1.0);
    }
}
