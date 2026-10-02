"""
Batch Landmark Extraction from Video Files and Webcam Streams for ISL.
Uses OpenCV and MediaPipe Holistic to extract upper-body pose and 21-point
dual-hand landmark coordinates into structured numpy arrays.
"""

import os
import sys
import glob
import json
import argparse
import numpy as np
import cv2

try:
    import mediapipe as mp
except ImportError:
    mp = None

from ml.preprocessing.normalizer import (
    LandmarkNormalizer,
    TOTAL_FEATURE_DIM,
    DEFAULT_SEQUENCE_LENGTH,
)


class LandmarkExtractor:
    """
    Extracts multi-modal landmark sequences from video files or camera streams.
    """

    def __init__(self, sequence_length=DEFAULT_SEQUENCE_LENGTH, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        self.sequence_length = sequence_length
        self.normalizer = LandmarkNormalizer(sequence_length=sequence_length)
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence

    def _init_holistic(self):
        if mp is None:
            raise ImportError("mediapipe is not installed. Please install mediapipe.")
        return mp.solutions.holistic.Holistic(
            min_detection_confidence=self.min_detection_confidence,
            min_tracking_confidence=self.min_tracking_confidence
        )

    def extract_from_video(self, video_path):
        """
        Extracts landmark sequence from a video file.
        Returns numpy array of shape (sequence_length, 225)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"[Error] Unable to open video: {video_path}")
            return None

        frames_features = []
        with self._init_holistic() as holistic:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                # Convert color space for MediaPipe (BGR -> RGB)
                image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image_rgb.flags.writeable = False
                results = holistic.process(image_rgb)

                # Extract landmarks
                keypoints = self.normalizer.extract_keypoints_from_results(results)
                normalized_frame = self.normalizer.normalize_frame(keypoints)
                frames_features.append(normalized_frame)

        cap.release()

        if len(frames_features) == 0:
            print(f"[Warning] No frames detected in video: {video_path}")
            return None

        # Pad or truncate to fixed sequence length
        sequence = self.normalizer.pad_or_truncate_sequence(frames_features)
        return sequence

    def process_dataset(self, raw_dir, output_dir):
        """
        Iterates through raw_dir structure:
        raw_dir/
            HELLO/
                sample1.mp4
                sample2.mp4
            THANK_YOU/
                ...
        Saves extracted sequences as .npy arrays in output_dir:
        output_dir/
            HELLO/
                sample1.npy
        Also creates labels.json mapping.
        """
        os.makedirs(output_dir, exist_ok=True)
        class_folders = [d for d in os.listdir(raw_dir) if os.path.isdir(os.path.join(raw_dir, d))]
        if not class_folders:
            print(f"[Info] No class subdirectories found in {raw_dir}")
            return {}

        class_folders.sort()
        labels_map = {idx: label for idx, label in enumerate(class_folders)}
        summary = {"classes": labels_map, "samples_per_class": {}}

        print(f"Starting batch extraction for {len(class_folders)} classes: {class_folders}")

        for label in class_folders:
            src_class_dir = os.path.join(raw_dir, label)
            dst_class_dir = os.path.join(output_dir, label)
            os.makedirs(dst_class_dir, exist_ok=True)

            video_files = []
            for ext in ('*.mp4', '*.avi', '*.mov', '*.mkv', '*.webm'):
                video_files.extend(glob.glob(os.path.join(src_class_dir, ext)))

            print(f"Extracting {len(video_files)} videos for sign '{label}'...")
            count = 0
            for idx, vid_path in enumerate(video_files):
                seq = self.extract_from_video(vid_path)
                if seq is not None:
                    base_name = os.path.splitext(os.path.basename(vid_path))[0]
                    dst_path = os.path.join(dst_class_dir, f"{base_name}.npy")
                    np.save(dst_path, seq)
                    count += 1

            summary["samples_per_class"][label] = count

        # Save class labels
        with open(os.path.join(output_dir, "labels.json"), "w", encoding="utf-8") as f:
            json.dump(labels_map, f, indent=2)

        print("[Success] Batch landmark extraction complete.")
        print(f"Summary: {summary}")
        return summary


def main():
    parser = argparse.ArgumentParser(description="Extract MediaPipe landmarks from ISL videos")
    parser.add_argument("--raw_dir", type=str, default="ml/dataset/raw", help="Path to raw videos folder")
    parser.add_argument("--output_dir", type=str, default="ml/dataset/processed", help="Path to save numpy sequences")
    parser.add_argument("--sequence_length", type=int, default=DEFAULT_SEQUENCE_LENGTH, help="Number of frames per sequence")
    args = parser.parse_args()

    extractor = LandmarkExtractor(sequence_length=args.sequence_length)
    extractor.process_dataset(args.raw_dir, args.output_dir)


if __name__ == "__main__":
    main()
