#!/usr/bin/env python3
"""
Monster Image Analyzer
Extracts monster names and determines rarity from Game Boy Color monster info screens
"""

import os
import sys
from PIL import Image
import pytesseract
import numpy as np
from collections import Counter

def extract_monster_name(image_path):
    """Extract monster name from the top portion of the image"""
    try:
        img = Image.open(image_path)
        
        # Crop to name area (top portion, adjust coordinates as needed)
        name_area = img.crop((10, 5, 150, 25))
        
        # Convert to grayscale for better OCR
        name_area = name_area.convert('L')
        
        # Use OCR to extract text
        name = pytesseract.image_to_string(name_area, config='--psm 8').strip()
        
        # Clean up the name (remove special characters, extra spaces)
        name = ''.join(c for c in name if c.isalnum() or c.isspace()).strip()
        
        return name
    except Exception as e:
        print(f"Error extracting name from {image_path}: {e}")
        return None

def analyze_star_colors(image_path):
    """Analyze the star area to determine rarity based on color"""
    try:
        img = Image.open(image_path)
        
        # Crop to star area (adjust coordinates based on your images)
        star_area = img.crop((20, 45, 120, 65))
        
        # Convert to RGB array
        pixels = np.array(star_area)
        
        # Define color ranges for each rarity (RGB values)
        color_ranges = {
            'grey': [(100, 100, 100), (160, 160, 160)],      # 1 star
            'green': [(0, 150, 0), (100, 255, 100)],         # 1.5 stars
            'blue': [(0, 0, 150), (100, 100, 255)],          # 2 stars
            'purple': [(100, 0, 150), (200, 100, 255)],      # 2.5 stars
            'gold': [(200, 200, 0), (255, 255, 100)],        # 3-3.5 stars
            'red': [(150, 0, 0), (255, 100, 100)]            # 4 stars
        }
        
        # Count pixels in each color range
        color_counts = {}
        total_pixels = pixels.shape[0] * pixels.shape[1]
        
        for color_name, (min_rgb, max_rgb) in color_ranges.items():
            mask = np.all((pixels >= min_rgb) & (pixels <= max_rgb), axis=2)
            count = np.sum(mask)
            color_counts[color_name] = count / total_pixels
        
        # Determine dominant color
        dominant_color = max(color_counts, key=color_counts.get)
        
        # Map colors to rarity values
        rarity_map = {
            'grey': 1.0,
            'green': 1.5,
            'blue': 2.0,
            'purple': 2.5,
            'gold': 3.0,  # Will need additional logic to distinguish 3.0 vs 3.5
            'red': 4.0
        }
        
        # Count visible stars to distinguish between 3.0 and 3.5 for gold
        if dominant_color == 'gold':
            # Count star-like shapes or use additional heuristics
            # For now, default to 3.0, but this could be enhanced
            return 3.0
        
        return rarity_map.get(dominant_color, 1.0)
        
    except Exception as e:
        print(f"Error analyzing stars in {image_path}: {e}")
        return 1.0

def count_stars(image_path):
    """Count the number of visible stars to help determine exact rarity"""
    try:
        img = Image.open(image_path)
        star_area = img.crop((20, 45, 120, 65))
        
        # Convert to grayscale
        gray = star_area.convert('L')
        pixels = np.array(gray)
        
        # Look for star-shaped bright spots
        # This is a simplified approach - could be enhanced with shape detection
        bright_pixels = np.sum(pixels > 200)
        
        # Estimate star count based on bright pixel density
        if bright_pixels > 800:
            return 4
        elif bright_pixels > 600:
            return 3.5
        elif bright_pixels > 400:
            return 3
        elif bright_pixels > 200:
            return 2.5
        elif bright_pixels > 100:
            return 2
        elif bright_pixels > 50:
            return 1.5
        else:
            return 1
            
    except Exception as e:
        print(f"Error counting stars in {image_path}: {e}")
        return 1

def analyze_monster_image(image_path):
    """Main function to analyze a monster image and return name and rarity"""
    name = extract_monster_name(image_path)
    rarity = analyze_star_colors(image_path)
    star_count = count_stars(image_path)
    
    # Use star count to refine rarity for gold stars
    color_rarity = analyze_star_colors(image_path)
    if color_rarity == 3.0:  # Gold color detected
        if star_count >= 3.5:
            rarity = 3.5
        else:
            rarity = 3.0
    else:
        rarity = color_rarity
    
    return {
        'name': name,
        'rarity': rarity,
        'image_path': image_path
    }

def process_directory(directory_path):
    """Process all images in a directory"""
    results = []
    
    for filename in os.listdir(directory_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            image_path = os.path.join(directory_path, filename)
            result = analyze_monster_image(image_path)
            results.append(result)
            print(f"Processed {filename}: {result['name']} - {result['rarity']} stars")
    
    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python monster_analyzer.py <image_path_or_directory>")
        sys.exit(1)
    
    path = sys.argv[1]
    
    if os.path.isfile(path):
        # Single image
        result = analyze_monster_image(path)
        print(f"Monster: {result['name']}")
        print(f"Rarity: {result['rarity']} stars")
    elif os.path.isdir(path):
        # Directory of images
        results = process_directory(path)
        
        # Output results in a format that can be used to update the database
        print("\n--- Database Update Format ---")
        for result in results:
            if result['name']:
                print(f"UPDATE monsters SET rarity = {result['rarity']} WHERE name = '{result['name']}';")
    else:
        print(f"Error: {path} is not a valid file or directory")

if __name__ == "__main__":
    main()