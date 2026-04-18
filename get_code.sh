OUTPUT_FILE="all_code.txt"

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Find all .ts, .tsx, and .java files, excluding specified directories,
# and append their path and content to the output file.
find . -type f \( -name "*.py" \) \
-not -path "./.git/*" \
-not -path "./frontend/node_modules/*" \
-not -path "./backend/target/*" \
-not -path "./backendtest/node_modules/*" \
-not -path "./maria_db/*" \
-not -path "./python-stt/.venv/*" \
-print0 | while IFS= read -r -d $'\0' file; do
    echo "File: $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n============================================================\n\n" >> "$OUTPUT_FILE"
done

echo "All ts, tsx, and java files have been concatenated into $OUTPUT_FILE"