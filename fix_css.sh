cat css/layout.css | awk '
BEGIN {
    in_bad = 0;
}
{
    print $0;
}
' > temp.css
# Not using awk since it is tricky. I will use edit_file.
