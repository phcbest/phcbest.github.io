window.TEXT_SEARCH_DATA={
  {%- assign _collection_separator = '' -%}
  {%- for _collection in site.collections -%}
    {%- if include.section == 'life' -%}
      {%- unless _collection.label == 'life' -%}{%- continue -%}{%- endunless -%}
    {%- elsif _collection.label == 'life' -%}
      {%- continue -%}
    {%- endif -%}
    {{ _collection_separator }}
    '{{ _collection.label }}':[
      {%- for _article in _collection.docs -%}
      {%- unless forloop.first -%},{%- endunless -%}
      {'title':{{ _article.title | jsonify }},
      {%- include snippets/prepend-baseurl.html path=_article.url -%}
      {%- assign _url = __return -%}
      'url':{{ _url | jsonify }}}
      {%- endfor -%}
    ]
    {%- assign _collection_separator = ',' -%}
  {%- endfor -%}
};
