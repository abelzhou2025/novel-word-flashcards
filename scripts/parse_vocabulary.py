#!/usr/bin/env python3
import re
import json
import sys

def parse_cet4_line(line):
    """Parse CET4 format: abandon [əˈbændən] vt.丢弃；放弃，抛弃"""
    line = line.strip()
    if not line or line.startswith('大学英语') or line.startswith('(共') or len(line) < 3:
        return None
    
    # Match pattern: word [pronunciation] part_of_speech. translation
    match = re.match(r'^([a-zA-Z\'\-]+)\s+\[([^\]]+)\]\s+(.+)$', line)
    if match:
        word = match.group(1).strip()
        pronunciation = match.group(2).strip()
        translation = match.group(3).strip()
        
        # Clean up translation - remove part of speech if it's at the start
        translation = re.sub(r'^[a-z\.]+\.\s*', '', translation, flags=re.IGNORECASE)
        
        return {
            'word': word,
            'pronunciation': pronunciation,
            'translation': translation
        }
    return None

def parse_cet6_line(line):
    """Parse CET6 format: abandon [əˈbændən] v. 1. 抛弃，放弃 2. 离弃(家园、船只、飞机等) 3. 遗弃(妻、子女等)"""
    line = line.strip()
    if not line or len(line) < 3:
        return None
    
    # Match pattern: word [pronunciation] part_of_speech. translation
    match = re.match(r'^([a-zA-Z\'\-]+)\s+\[([^\]]+)\]\s+(.+)$', line)
    if match:
        word = match.group(1).strip()
        pronunciation = match.group(2).strip()
        translation = match.group(3).strip()
        
        # Clean up translation - remove part of speech if it's at the start
        translation = re.sub(r'^[a-z\.]+\s+', '', translation, flags=re.IGNORECASE)
        
        # Replace numbered list format with simpler format
        translation = re.sub(r'\s*\d+\.\s*', ' ', translation)
        translation = translation.strip()
        
        return {
            'word': word,
            'pronunciation': pronunciation,
            'translation': translation
        }
    return None

def parse_file(filepath, parser):
    words = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            result = parser(line)
            if result:
                words.append(result)
    return words

def generate_ts_file(cet4_words, cet6_words, output_path):
    """Generate TypeScript file with vocabulary data"""
    
    def format_word(vocab_type, word_data, index):
        word_id = f'cet{4 if vocab_type == "CET4" else 6}-{word_data["word"]}'
        # Escape single quotes in translation
        translation = word_data['translation'].replace("'", "\\'")
        pronunciation = word_data['pronunciation'].replace("'", "\\'")
        return f"    {{ id: '{word_id}', word: '{word_data['word']}', pronunciation: '{pronunciation}', translation: '{translation}' }}"
    
    lines = [
        "",
        "import { Vocabulary, Word } from '../types';",
        "",
        "type VocabularyData = {",
        "  [key in Vocabulary]: Word[];",
        "};",
        "",
        "export const vocabularyData: VocabularyData = {",
        "  [Vocabulary.CET4]: ["
    ]
    
    # Add CET4 words
    for i, word in enumerate(cet4_words):
        comma = ',' if i < len(cet4_words) - 1 or len(cet6_words) > 0 else ''
        lines.append(format_word("CET4", word, i) + comma)
    
    lines.append("  ],")
    lines.append("  [Vocabulary.CET6]: [")
    
    # Add CET6 words
    for i, word in enumerate(cet6_words):
        comma = ',' if i < len(cet6_words) - 1 else ''
        lines.append(format_word("CET6", word, i) + comma)
    
    lines.append("  ]")
    lines.append("};")
    lines.append("")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Generated {output_path}")
    print(f"CET4 words: {len(cet4_words)}")
    print(f"CET6 words: {len(cet6_words)}")

if __name__ == '__main__':
    cet4_path = '/Users/abel/Downloads/CET4_edited.txt'
    cet6_path = '/Users/abel/Downloads/CET6_edited.txt'
    output_path = '/Users/abel/Desktop/novel-word-flashcards1229/data/mockWords.ts'
    
    print("Parsing CET4 file...")
    cet4_words = parse_file(cet4_path, parse_cet4_line)
    print(f"Found {len(cet4_words)} CET4 words")
    
    print("Parsing CET6 file...")
    cet6_words = parse_file(cet6_path, parse_cet6_line)
    print(f"Found {len(cet6_words)} CET6 words")
    
    print("Generating TypeScript file...")
    generate_ts_file(cet4_words, cet6_words, output_path)
    print("Done!")

