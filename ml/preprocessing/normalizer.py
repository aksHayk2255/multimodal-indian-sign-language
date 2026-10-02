"""
Robust Biomechanical Feature Extractor and Landmark Normalizer for ISL Recognition.
Standardizes multi-modal spatial landmarks (left hand, right hand, upper body pose)
and temporal kinematics into an invariant 189-dimensional feature representation:
- Right Hand 21 3D joints (wrist-relative, palm-scaled): 63 features
- Left Hand 21 3D joints (wrist-relative, palm-scaled): 63 features
- Finger Extension & Spread States (curl ratios & inter-finger spans): 18 features
- Key Upper-Body Pose Joints (shoulder-centered, scale-invariant): 21 features
- Spatial Relationships (hand-to-face, hand-to-shoulder, hand-to-hand): 13 features
- Motion Velocity Dynamics (wrist deltas & instantaneous speed): 8 features
- Presence Indicators (hands visibility flags): 3 features
Total Dimension: 189 features.
"""

import math
import numpy as np

HAND_LANDMARKS_COUNT = 21
HAND_FEATURE_DIM = 63
POSE_LANDMARKS_COUNT = 33
POSE_FEATURE_DIM = 99
TOTAL_FEATURE_DIM = 189
DEFAULT_SEQUENCE_LENGTH = 30


class LandmarkNormalizer:
    """
    State-of-the-Art Invariant ISL Landmark Normalizer & Kinematic Feature Extractor.
    """

    def __init__(self, sequence_length=DEFAULT_SEQUENCE_LENGTH):
        self.sequence_length = sequence_length
        self.feature_dim = TOTAL_FEATURE_DIM
        self.last_rw = None
        self.last_lw = None

    @staticmethod
    def _dist(p1, p2):
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    @staticmethod
    def _dist3d(p1, p2):
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2)

    def extract_features_from_raw(self, pose_pts, lh_pts, rh_pts, prev_wrists=None):
        """
        Extracts 189 invariant features from raw landmark lists.
        pose_pts: array or list of 33 points [[x, y, z], ...]
        lh_pts: array or list of 21 points [[x, y, z], ...] or None
        rh_pts: array or list of 21 points [[x, y, z], ...] or None
        """
        feat = np.zeros(TOTAL_FEATURE_DIM, dtype=np.float32)

        has_lh = lh_pts is not None and len(lh_pts) == 21 and not np.all(np.array(lh_pts) == 0)
        has_rh = rh_pts is not None and len(rh_pts) == 21 and not np.all(np.array(rh_pts) == 0)
        has_both = has_lh and has_rh

        # 1. Pose Shoulder Center & Scale
        has_pose = pose_pts is not None and len(pose_pts) >= 17
        mid_x, mid_y, sh_scale = 0.5, 0.5, 0.20
        nose = np.array([0.5, 0.2, 0.0], dtype=np.float32)
        l_sh = np.array([0.6, 0.35, 0.0], dtype=np.float32)
        r_sh = np.array([0.4, 0.35, 0.0], dtype=np.float32)
        l_w = np.array([0.65, 0.7, 0.0], dtype=np.float32)
        r_w = np.array([0.35, 0.7, 0.0], dtype=np.float32)

        if has_pose:
            p_arr = np.array(pose_pts, dtype=np.float32)
            nose = p_arr[0][:3]
            l_sh = p_arr[11][:3]
            r_sh = p_arr[12][:3]
            l_w = p_arr[15][:3]
            r_w = p_arr[16][:3]

            mid_x = float((l_sh[0] + r_sh[0]) / 2.0)
            mid_y = float((l_sh[1] + r_sh[1]) / 2.0)
            w = math.hypot(l_sh[0] - r_sh[0], l_sh[1] - r_sh[1])
            sh_scale = max(w, 0.08)

        # 2. Right Hand Joints (0..62) & Finger States (126..134)
        if has_rh:
            rh_arr = np.array(rh_pts, dtype=np.float32)
            w = rh_arr[0][:3]
            mcp = rh_arr[9][:3]
            palm_len = max(math.hypot(w[0] - mcp[0], w[1] - mcp[1]), 0.03)

            for i in range(21):
                feat[i * 3] = (rh_arr[i][0] - w[0]) / palm_len
                feat[i * 3 + 1] = (rh_arr[i][1] - w[1]) / palm_len
                feat[i * 3 + 2] = (rh_arr[i][2] - w[2]) / palm_len

            # Finger states: 9 values for RH at indices 126..134
            t_tip = rh_arr[4][:3]
            i_tip = rh_arr[8][:3]
            m_tip = rh_arr[12][:3]
            r_tip = rh_arr[16][:3]
            p_tip = rh_arr[20][:3]
            i_mcp = rh_arr[5][:3]

            feat[126] = self._dist(t_tip, i_mcp) / palm_len
            feat[127] = self._dist(i_tip, w) / palm_len  # index curl
            feat[128] = self._dist(m_tip, w) / palm_len  # middle curl
            feat[129] = self._dist(r_tip, w) / palm_len  # ring curl
            feat[130] = self._dist(p_tip, w) / palm_len  # pinky curl
            feat[131] = self._dist(t_tip, i_tip) / palm_len  # pinch
            feat[132] = self._dist(i_tip, m_tip) / palm_len  # spread 1
            feat[133] = self._dist(m_tip, r_tip) / palm_len  # spread 2
            feat[134] = self._dist(r_tip, p_tip) / palm_len  # spread 3

            r_w = w  # Use actual hand wrist if available

        # 3. Left Hand Joints (63..125) & Finger States (135..143)
        if has_lh:
            lh_arr = np.array(lh_pts, dtype=np.float32)
            w = lh_arr[0][:3]
            mcp = lh_arr[9][:3]
            palm_len = max(math.hypot(w[0] - mcp[0], w[1] - mcp[1]), 0.03)

            for i in range(21):
                feat[63 + i * 3] = (lh_arr[i][0] - w[0]) / palm_len
                feat[63 + i * 3 + 1] = (lh_arr[i][1] - w[1]) / palm_len
                feat[63 + i * 3 + 2] = (lh_arr[i][2] - w[2]) / palm_len

            # Finger states: 9 values for LH at indices 135..143
            t_tip = lh_arr[4][:3]
            i_tip = lh_arr[8][:3]
            m_tip = lh_arr[12][:3]
            r_tip = lh_arr[16][:3]
            p_tip = lh_arr[20][:3]
            i_mcp = lh_arr[5][:3]

            feat[135] = self._dist(t_tip, i_mcp) / palm_len
            feat[136] = self._dist(i_tip, w) / palm_len  # index curl
            feat[137] = self._dist(m_tip, w) / palm_len  # middle curl
            feat[138] = self._dist(r_tip, w) / palm_len  # ring curl
            feat[139] = self._dist(p_tip, w) / palm_len  # pinky curl
            feat[140] = self._dist(t_tip, i_tip) / palm_len  # pinch
            feat[141] = self._dist(i_tip, m_tip) / palm_len  # spread 1
            feat[142] = self._dist(m_tip, r_tip) / palm_len  # spread 2
            feat[143] = self._dist(r_tip, p_tip) / palm_len  # spread 3

            l_w = w

        # 4. Upper-Body Pose Joints (144..164): 7 joints x 3 coords
        # Key joints: [0: nose, 11: l_sh, 12: r_sh, 13: l_elb, 14: r_elb, 15: l_w, 16: r_w]
        if has_pose:
            p_arr = np.array(pose_pts, dtype=np.float32)
            key_indices = [0, 11, 12, 13, 14, 15, 16]
            for idx_order, p_idx in enumerate(key_indices):
                pt = p_arr[p_idx][:3]
                feat[144 + idx_order * 3] = (pt[0] - mid_x) / sh_scale
                feat[144 + idx_order * 3 + 1] = (pt[1] - mid_y) / sh_scale
                feat[144 + idx_order * 3 + 2] = (pt[2] if len(pt) > 2 else 0.0) / sh_scale

        # 5. Spatial Relative Relationships (165..177): 13 features
        # Right wrist to Nose vector (3)
        feat[165] = (r_w[0] - nose[0]) / sh_scale
        feat[166] = (r_w[1] - nose[1]) / sh_scale
        feat[167] = (r_w[2] - nose[2]) / sh_scale
        # Left wrist to Nose vector (3)
        feat[168] = (l_w[0] - nose[0]) / sh_scale
        feat[169] = (l_w[1] - nose[1]) / sh_scale
        feat[170] = (l_w[2] - nose[2]) / sh_scale
        # Right wrist to Right shoulder vector (3)
        feat[171] = (r_w[0] - r_sh[0]) / sh_scale
        feat[172] = (r_w[1] - r_sh[1]) / sh_scale
        feat[173] = (r_w[2] - r_sh[2]) / sh_scale
        # Left wrist to Left shoulder vector (3)
        feat[174] = (l_w[0] - l_sh[0]) / sh_scale
        feat[175] = (l_w[1] - l_sh[1]) / sh_scale
        feat[176] = (l_w[2] - l_sh[2]) / sh_scale
        # Left wrist to Right wrist distance (1)
        feat[177] = self._dist(l_w, r_w) / sh_scale

        # 6. Motion Velocity Dynamics (178..185): 8 features
        rw_vel = [0.0, 0.0, 0.0]
        lw_vel = [0.0, 0.0, 0.0]
        if prev_wrists is not None:
            if "r" in prev_wrists and prev_wrists["r"] is not None:
                pr = prev_wrists["r"]
                rw_vel = [(r_w[0] - pr[0]) / sh_scale, (r_w[1] - pr[1]) / sh_scale, (r_w[2] - pr[2]) / sh_scale]
            if "l" in prev_wrists and prev_wrists["l"] is not None:
                pl = prev_wrists["l"]
                lw_vel = [(l_w[0] - pl[0]) / sh_scale, (l_w[1] - pl[1]) / sh_scale, (l_w[2] - pl[2]) / sh_scale]

        feat[178:181] = rw_vel
        feat[181:184] = lw_vel
        feat[184] = math.sqrt(rw_vel[0]**2 + rw_vel[1]**2 + rw_vel[2]**2)  # right speed
        feat[185] = math.sqrt(lw_vel[0]**2 + lw_vel[1]**2 + lw_vel[2]**2)  # left speed

        # 7. Presence Indicators (186..188): 3 features
        feat[186] = 1.0 if has_rh else 0.0
        feat[187] = 1.0 if has_lh else 0.0
        feat[188] = 1.0 if has_both else 0.0

        return feat

    def normalize_frame(self, features):
        """
        Pass-through or adapts existing feature arrays to (189,).
        """
        arr = np.array(features, dtype=np.float32).flatten()
        if len(arr) == TOTAL_FEATURE_DIM:
            return arr
        elif len(arr) > TOTAL_FEATURE_DIM:
            return arr[:TOTAL_FEATURE_DIM]
        else:
            padded = np.zeros(TOTAL_FEATURE_DIM, dtype=np.float32)
            padded[:len(arr)] = arr
            return padded

    def pad_or_truncate_sequence(self, sequence):
        """
        Ensures a sequence of frames has shape (sequence_length, feature_dim).
        If shorter, pads with last valid frame or zeros.
        If longer, uniformly samples down to sequence_length.
        """
        seq = np.array(sequence, dtype=np.float32)
        if len(seq) == 0:
            return np.zeros((self.sequence_length, self.feature_dim), dtype=np.float32)

        cur_len = len(seq)
        if cur_len == self.sequence_length:
            return seq
        elif cur_len > self.sequence_length:
            indices = np.linspace(0, cur_len - 1, self.sequence_length, dtype=int)
            return seq[indices]
        else:
            pad_count = self.sequence_length - cur_len
            last_frame = seq[-1:]
            padding = np.repeat(last_frame, pad_count, axis=0)
            return np.concatenate([seq, padding], axis=0)
