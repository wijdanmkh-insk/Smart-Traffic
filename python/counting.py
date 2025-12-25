import cv2
from ultralytics import solutions
from load_roi import load_roi

def count_video(video_path, direction, model_path):
    roi = load_roi(direction)

    counter = solutions.ObjectCounter(
        region=roi,
        model=model_path,
        show=False,
        classes=[2,3,5,7]
    )

    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        counter(frame)

    cap.release()
    print(f"{direction} total:", counter.total_count)
