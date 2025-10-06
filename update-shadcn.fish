#!/usr/bin/env fish

echo "Reading component folders from src/lib/components/ui..."

if not test -d src/lib/components/ui
    echo "Error: src/lib/components/ui directory does not exist"
    exit 1
end

set components (find src/lib/components/ui -mindepth 1 -maxdepth 1 -type d | xargs -n 1 basename)

if test -z "$components"
    echo "No component directories found in src/lib/components/ui"
    exit 1
end

echo "Found "(count $components)" components to install"

set total (count $components)
set current 0
set successful 0
set failed 0

for component in $components
    set current (math $current + 1)
    echo ""
    echo "[$current/$total] Installing component: $component..."
    
    if bun x shadcn-svelte@latest add $component
        echo "✓ Successfully installed $component"
        set successful (math $successful + 1)
    else
        echo "✗ Failed to install $component"
        set failed (math $failed + 1)
    end
end

echo ""
echo "Installation complete!"
echo "✓ Successfully installed: $successful components"
if test $failed -gt 0
    echo "✗ Failed to install: $failed components"
end