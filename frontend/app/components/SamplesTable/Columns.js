
const getHeight = function() {
  return $(window).height() - $('#mainnav').outerHeight(true);
  }

const operateFormatter = function(value, row, index) {
  return [
      '<div class="btn-group" data-toggle="modal" data-target="#comment" data-whatever="Text of comment to this variant"><a type="button" class="btn btn-link variant" data-toggle="popover" data-placement="right" data-container="body" data-trigger="hover" data-content="Text of comment to this variant">',
      '<i class="fa fa-comment-o"></i>',
      '</a></div>'
  ].join('');
};

const operateFormatter1 = function(value, row, index) {
  return [
      '<div class="btn-group"><a type="button" id="fav' + index + '" class="btn btn-link fav" data-toggle="button">',
      '<i class="fa fa-star-o"></i>',
      '</a></div>'
  ].join('');
};

const operateFormatter2 = function(value, row, index) {
  return [
      '<input type="text" class="form-control elipsis" value="' + value + '">'
  ].join('');
}
          
export default {
  url: './json/data-variants.json',
  classes: 'table table-condensed table-hover',
  height: getHeight(),
  columns: [
    {
        field: 'state',
        checkbox: true
    },
    {
        field: 'comment',
        title: "Comment",
        formatter: operateFormatter2,
        filterControl: 'input'
    },
    {
        field: 'function',
        title: "Function",
        filterControl: 'input'
    },
    {
        field: 'gene',
        title: "Gene",
        filterControl: 'input'
    },
    {
        field: 'chromosome',
        title: "Chromosome",
        filterControl: 'input'
    },
    {
        field: 'startCoordinate',
        title: "StartCoordinate",
        filterControl: 'input'
    },
    {
        field: 'endCoordinate',
        title: 'End Coordinate',
        filterControl: 'input'
    },
    {
        field: 'cytogeneticBand',
        title: 'Cytogenetic Band',
        filterControl: 'input'
    },
    {
        field: 'affectedAminoAcid',
        title: 'Affected Amino Acid',
        filterControl: 'input'
    },
    {
        field: 'proteinChange',
        title: 'Protein Change',
        filterControl: 'input'
    },
    {
        field: 'granthamScore',
        title: 'GranthamScore',
        filterControl: 'input'
    },
    {
        field: 'functionalConsequence',
        title: 'Functional Consequence',
        filterControl: 'input'
    },
    {
        field: 'transcript',
        title: 'Transcript',
        filterControl: 'input'
    },
    {
        field: 'nucleotideChange',
        title: 'Nucleotide Change',
        filterControl: 'input'
    }
  ]
};  

