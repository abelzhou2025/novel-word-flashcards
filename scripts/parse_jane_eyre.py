#!/usr/bin/env python3
"""
Parse Jane Eyre novel text file and generate TypeScript file with chapters.
"""
import re
import json

def parse_jane_eyre(filepath):
    """Parse Jane Eyre novel and split into chapters."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find where the actual novel starts (after prefaces and metadata)
    # Look for "CHAPTER I" (the first chapter)
    start_pattern = r'^CHAPTER I\s*$'
    match = re.search(start_pattern, content, re.MULTILINE)
    if not match:
        print("Warning: Could not find 'CHAPTER I', trying alternative patterns...")
        # Try without the strict start pattern
        start_pattern = r'CHAPTER I'
        match = re.search(start_pattern, content)
    
    if not match:
        raise ValueError("Could not find the start of the novel (CHAPTER I)")
    
    # Find where the novel ends (before the license text)
    end_pattern = r'\*\*\* END OF THE PROJECT GUTENBERG EBOOK'
    end_match = re.search(end_pattern, content)
    if end_match:
        content = content[match.start():end_match.start()]
    else:
        content = content[match.start():]
        print("Warning: Could not find end marker, using full content")
    
    # Split by chapter headers
    # Pattern matches "CHAPTER" followed by Roman numerals or "XXXVIII—CONCLUSION"
    chapter_pattern = r'^CHAPTER\s+([IVXLCDM]+(?:—[A-Z]+)?)\s*$'
    chapters = []
    
    # Find all chapter starts
    chapter_starts = []
    for match in re.finditer(chapter_pattern, content, re.MULTILINE):
        chapter_starts.append(match.start())
    
    if not chapter_starts:
        raise ValueError("Could not find any chapters in the text")
    
    print(f"Found {len(chapter_starts)} chapters")
    
    # Extract each chapter
    for i, start_pos in enumerate(chapter_starts):
        if i < len(chapter_starts) - 1:
            end_pos = chapter_starts[i + 1]
            chapter_text = content[start_pos:end_pos]
        else:
            chapter_text = content[start_pos:]
        
        # Remove the chapter header line
        chapter_text = re.sub(r'^CHAPTER\s+[IVXLCDM]+(?:—[A-Z]+)?\s*\n+', '', chapter_text, flags=re.MULTILINE)
        # Trim whitespace
        chapter_text = chapter_text.strip()
        
        if chapter_text:
            chapters.append(chapter_text)
    
    print(f"Extracted {len(chapters)} chapters")
    return chapters

def generate_ts_file(chapters, output_path):
    """Generate TypeScript file with chapter data."""
    # Escape the text properly for TypeScript template literals
    escaped_chapters = []
    for chapter in chapters:
        # Replace backticks with ${'`'} to avoid breaking template literals
        chapter = chapter.replace('\\', '\\\\')  # Escape backslashes first
        chapter = chapter.replace('`', '\\`')     # Escape backticks
        chapter = chapter.replace('${', '\\${')   # Escape template expressions
        escaped_chapters.append(chapter)
    
    # Generate the TypeScript file content
    ts_content = f"""export const janeEyreChapters: string[] = [
"""
    
    # Add each chapter as a template literal
    for i, chapter in enumerate(escaped_chapters):
        ts_content += f'  `{chapter}`'
        if i < len(escaped_chapters) - 1:
            ts_content += ','
        ts_content += '\n'
    
    ts_content += """];
"""
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"Generated {output_path}")
    print(f"Total chapters: {len(chapters)}")
    for i, chapter in enumerate(chapters, 1):
        print(f"  Chapter {i}: {len(chapter)} characters")

if __name__ == '__main__':
    input_file = '/Users/abel/Desktop/Novels/Jane Eyre.txt'
    output_file = 'data/janeEyre.ts'
    
    print(f"Parsing {input_file}...")
    chapters = parse_jane_eyre(input_file)
    
    print(f"Generating {output_file}...")
    generate_ts_file(chapters, output_file)
    
    print("Done!")

