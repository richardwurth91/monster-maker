#!/bin/bash

cd assets/to_process

for zip_file in *.zip; do
    if [ -f "$zip_file" ]; then
        # Extract monster name (remove .zip extension)
        monster_name="${zip_file%.zip}"
        
        # Create temporary directory
        temp_dir="temp_$monster_name"
        mkdir -p "$temp_dir"
        
        # Unzip files to temp directory
        unzip -q "$zip_file" -d "$temp_dir"
        
        # Create parts directory for this monster
        mkdir -p "../parts/$monster_name"
        
        # Process each file in the temp directory
        for file in "$temp_dir"/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                # Remove _1 from filename
                new_filename="${filename%_1.png}.png"
                
                # If the filename matches the monster name, move to monsters directory
                if [ "$new_filename" = "$monster_name.png" ]; then
                    mv "$file" "../monsters/$new_filename"
                else
                    # Move parts to the monster's parts directory
                    mv "$file" "../parts/$monster_name/$new_filename"
                fi
            fi
        done
        
        # Clean up temp directory
        rm -rf "$temp_dir"
        
        echo "Processed $monster_name"
    fi
done

echo "All monsters processed!"